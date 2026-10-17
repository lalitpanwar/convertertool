export type ImageProblem = 'empty' | 'unsupported' | 'unreadable' | 'too-big';

/** A picture the browser cannot use. Carries the file name so the UI can say WHICH one. */
export class ImageError extends Error {
  constructor(
    public fileName: string,
    public reason: ImageProblem,
  ) {
    super(`${reason}: ${fileName}`);
  }
}

/** Plain-language message for the user (English UI text). */
export function describeImageProblem(fileName: string, reason: ImageProblem): string {
  switch (reason) {
    case 'empty':
      return `"${fileName}" is empty. It may still be downloading from your cloud or gallery. Save the photo again and add it, or remove it.`;
    case 'unsupported':
      return `"${fileName}" is in a format this browser cannot open (such as HEIC or AVIF). Export it as JPG or PNG and add it again, or remove it.`;
    case 'too-big':
      return `"${fileName}" is too large for your device's memory. Try a smaller copy of the photo, or remove it.`;
    default:
      return `"${fileName}" looks damaged or is not a real image. Remove it and try again.`;
  }
}

export interface Decoded {
  source: CanvasImageSource;
  /** pixels, EXIF orientation already applied */
  width: number;
  height: number;
  /** free the memory / object URL */
  release: () => void;
}

const fromBitmap = (bmp: ImageBitmap): Decoded => ({ source: bmp, width: bmp.width, height: bmp.height, release: () => bmp.close() });

async function viaImgElement(file: File): Promise<Decoded> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
    if (!img.naturalWidth || !img.naturalHeight) throw new Error('no size');
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
  return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) };
}

/** What a file that cannot be decoded most likely is (looked up from its first bytes). */
async function guessKind(file: File): Promise<'unsupported' | 'unreadable'> {
  try {
    const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const tag = String.fromCharCode(...head.slice(4, 12));
    if (/^ftyp(heic|heix|hevc|heim|heis|mif1|msf1|avif|avis)/.test(tag)) return 'unsupported';
  } catch {
    /* ignore */
  }
  return 'unreadable';
}

/**
 * Open an image in the most forgiving way: createImageBitmap with EXIF orientation, then
 * without options (older browsers), then a plain <img>. Throws ImageError with a clear reason.
 */
export async function decodeImage(file: File): Promise<Decoded> {
  if (file.size === 0) throw new ImageError(file.name, 'empty');
  const attempts: (() => Promise<Decoded>)[] = [
    async () => fromBitmap(await createImageBitmap(file, { imageOrientation: 'from-image' })),
    async () => fromBitmap(await createImageBitmap(file)),
    () => viaImgElement(file),
  ];
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch {
      /* try the next way */
    }
  }
  throw new ImageError(file.name, await guessKind(file));
}
