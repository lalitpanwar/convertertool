import { decodeImage, ImageError, type Decoded, type ImageProblem } from './decode';

export type Rotation = 0 | 90 | 180 | 270;

export interface Thumb {
  /** object URL of a small preview (caller must revoke) */
  url: string;
  /** natural size of the image (EXIF applied, NOT rotated by the user) */
  w: number;
  h: number;
  /** set when the browser could not open this file (url then points at the raw file) */
  failed?: ImageProblem;
}

/**
 * Small preview of an image with the user's rotation applied.
 * Also gives the natural size. Much lighter on memory than showing the full photo.
 */
export async function makeThumb(file: File, rotation: Rotation = 0, max = 600): Promise<Thumb> {
  let img: Decoded;
  try {
    img = await decodeImage(file);
  } catch (e) {
    return { url: URL.createObjectURL(file), w: 3, h: 4, failed: e instanceof ImageError ? e.reason : 'unreadable' };
  }
  try {
    const { width: w, height: h } = img;
    const swap = rotation % 180 !== 0;
    const scale = Math.min(1, max / Math.max(w, h));
    const dw = w * scale;
    const dh = h * scale;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(swap ? dh : dw));
    canvas.height = Math.max(1, Math.round(swap ? dw : dh));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no canvas');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(img.source, -dw / 2, -dh / 2, dw, dh);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.82));
    canvas.width = canvas.height = 0;
    if (!blob) throw new Error('no blob');
    return { url: URL.createObjectURL(blob), w, h };
  } catch {
    return { url: URL.createObjectURL(file), w: 3, h: 4, failed: 'too-big' };
  } finally {
    img.release();
  }
}
