import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { zipSync } from 'fflate';

// pdf.js parses and decodes in its own worker; only the final canvas drawing is on the page.
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

/** One page is never rendered bigger than this many pixels (keeps phones from running out of memory). */
const MAX_PIXELS = 36_000_000;

export class PdfLoadError extends Error {
  constructor(public reason: 'password' | 'invalid') {
    super(reason);
  }
}

export interface LoadedPdf {
  doc: PDFDocumentProxy;
  numPages: number;
}

/** Open a PDF. Throws PdfLoadError('password' | 'invalid'). */
export async function loadPdf(file: File): Promise<LoadedPdf> {
  try {
    // pdf.js hands the buffer to its worker (it becomes unusable here), so give it its own copy
    const data = new Uint8Array(await file.arrayBuffer());
    const doc = await pdfjs.getDocument({ data }).promise;
    return { doc, numPages: doc.numPages };
  } catch (e) {
    throw new PdfLoadError((e as { name?: string })?.name === 'PasswordException' ? 'password' : 'invalid');
  }
}

export async function closePdf(pdf: LoadedPdf | null): Promise<void> {
  try {
    await pdf?.doc.loadingTask.destroy(); // frees the document and its worker
  } catch {
    /* already gone */
  }
}

async function draw(doc: PDFDocumentProxy, pageNo: number, scale: number, canvas: HTMLCanvasElement) {
  const page = await doc.getPage(pageNo);
  const viewport = page.getViewport({ scale });
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  await page.render({ canvas, viewport, background: 'rgb(255,255,255)' }).promise;
  page.cleanup();
}

const toBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), 'image/jpeg', quality));

export interface Thumb {
  url: string;
  /** width / height of the page */
  aspect: number;
}

/** Small preview of one page (object URL: the caller revokes it). */
export async function renderThumb(pdf: LoadedPdf, pageNo: number, targetWidth = 320): Promise<Thumb> {
  const page = await pdf.doc.getPage(pageNo);
  const base = page.getViewport({ scale: 1 });
  page.cleanup();
  const canvas = document.createElement('canvas');
  await draw(pdf.doc, pageNo, targetWidth / base.width, canvas);
  const blob = await toBlob(canvas, 0.75);
  const aspect = canvas.width / canvas.height;
  canvas.width = canvas.height = 0;
  return { url: URL.createObjectURL(blob), aspect };
}

export interface ExportOptions {
  /** 72 = screen, 150 = standard, 300 = print */
  dpi: number;
  /** JPEG quality 0..1 */
  quality: number;
  /** name without extension, used for the file names */
  baseName: string;
  onProgress?: (done: number) => void;
}

export interface ExportResult {
  bytes: Uint8Array;
  type: 'image/jpeg' | 'application/zip';
  filename: string;
  count: number;
  /** true if some page was rendered smaller than asked (very large page) */
  scaledDown: boolean;
}

/** Render the chosen pages to JPG. One page -> a JPG file, several -> a ZIP of JPGs. */
export async function exportPages(pdf: LoadedPdf, pages: number[], opts: ExportOptions): Promise<ExportResult> {
  const canvas = document.createElement('canvas');
  const files: Record<string, Uint8Array> = {};
  let scaledDown = false;

  for (let i = 0; i < pages.length; i++) {
    const n = pages[i];
    const page = await pdf.doc.getPage(n);
    const base = page.getViewport({ scale: 1 });
    page.cleanup();
    let scale = opts.dpi / 72;
    const pixels = base.width * scale * (base.height * scale);
    if (pixels > MAX_PIXELS) {
      scale *= Math.sqrt(MAX_PIXELS / pixels);
      scaledDown = true;
    }
    await draw(pdf.doc, n, scale, canvas);
    const blob = await toBlob(canvas, opts.quality);
    files[`${opts.baseName}-page-${n}.jpg`] = new Uint8Array(await blob.arrayBuffer());
    opts.onProgress?.((i + 1) / pages.length);
  }
  canvas.width = canvas.height = 0;

  const names = Object.keys(files);
  if (names.length === 1) {
    return { bytes: files[names[0]], type: 'image/jpeg', filename: names[0], count: 1, scaledDown };
  }
  // JPEGs are already compressed: store them (level 0), it is faster and the size is the same
  return { bytes: zipSync(files, { level: 0 }), type: 'application/zip', filename: `${opts.baseName}-images.zip`, count: names.length, scaledDown };
}
