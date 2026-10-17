import { PDFDocument } from 'pdf-lib';
import type { Rotation } from '@/lib/image/thumb';
import { decodeImage, ImageError } from '@/lib/image/decode';
import { pageGeometry, type Margin, type Orientation, type PageSize } from './page-config';

export interface ImageInput {
  file: File;
  /** clockwise, chosen by the user */
  rotation: Rotation;
}

export interface JpgToPdfOptions {
  pageSize: PageSize;
  /** ignored when pageSize is 'fit' */
  orientation: Orientation;
  margin: Margin;
  /** called with 0..1 after each image */
  onProgress?: (done: number) => void;
}

/** Cap long side to keep memory safe on low-end phones */
const MAX_SIDE = 4000;
const JPEG_QUALITY = 0.92;

/**
 * Decode an image with EXIF orientation applied, return JPEG bytes + size.
 * Going through a canvas fixes sideways phone photos and handles PNG/WebP.
 */
async function toJpeg(file: File, rotation: Rotation): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const img = await decodeImage(file); // throws ImageError (empty / unsupported / unreadable)
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
    const drawW = Math.round(img.width * scale);
    const drawH = Math.round(img.height * scale);
    const swap = rotation % 180 !== 0;
    const width = swap ? drawH : drawW; // size AFTER rotation
    const height = swap ? drawW : drawH;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new ImageError(file.name, 'too-big');
    ctx.fillStyle = '#ffffff'; // transparent PNGs become white paper
    ctx.fillRect(0, 0, width, height);
    ctx.translate(width / 2, height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(img.source, -drawW / 2, -drawH / 2, drawW, drawH);

    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', JPEG_QUALITY));
    canvas.width = canvas.height = 0; // release memory
    if (!blob) throw new ImageError(file.name, 'too-big');
    return { bytes: new Uint8Array(await blob.arrayBuffer()), width, height };
  } finally {
    img.release();
  }
}

export async function jpgToPdf(files: ImageInput[], opts: JpgToPdfOptions): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const { bytes, width, height } = await toJpeg(files[i].file, files[i].rotation);
    const img = await pdf.embedJpg(bytes);

    const { pageW, pageH, margin } = pageGeometry(opts.pageSize, opts.orientation, opts.margin, width, height);

    const page = pdf.addPage([pageW, pageH]);
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;
    const ratio = Math.min(maxW / width, maxH / height);
    const drawW = width * ratio;
    const drawH = height * ratio;
    page.drawImage(img, {
      x: (pageW - drawW) / 2,
      y: (pageH - drawH) / 2,
      width: drawW,
      height: drawH,
    });
    opts.onProgress?.((i + 1) / files.length);
  }

  return pdf.save();
}
