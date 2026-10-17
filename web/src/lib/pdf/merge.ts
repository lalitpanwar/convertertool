import { PDFDocument } from 'pdf-lib';

export class MergeError extends Error {
  constructor(
    public fileName: string,
    public reason: 'encrypted' | 'invalid',
  ) {
    super(`${reason}: ${fileName}`);
  }
}

export interface MergeOptions {
  /** called with 0..1 after each file */
  onProgress?: (done: number) => void;
}

/** Combine PDFs in the given order into one. Throws MergeError naming the bad file. */
export async function mergePdfs(files: File[], opts: MergeOptions = {}): Promise<{ bytes: Uint8Array; pages: number }> {
  const out = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    let src: PDFDocument;
    try {
      src = await PDFDocument.load(await file.arrayBuffer(), { throwOnInvalidObject: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message.toLowerCase() : '';
      throw new MergeError(file.name, msg.includes('encrypt') ? 'encrypted' : 'invalid');
    }
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
    opts.onProgress?.((i + 1) / files.length);
  }

  const bytes = await out.save();
  return { bytes, pages: out.getPageCount() };
}
