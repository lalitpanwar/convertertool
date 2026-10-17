// fontkit's Hindi (Indic) shaper uses generators compiled for the old `regeneratorRuntime` global.
import 'regenerator-runtime/runtime.js';
import fontkit from '@pdf-lib/fontkit';
import type { PDFDocument, PDFFont } from 'pdf-lib';

// Noto fonts (SIL Open Font License). Vite turns each ?url import into a hashed asset that is
// downloaded only when a document needs it, so none of this is in the page's initial JavaScript.
import sansLatinR from '@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff?url';
import sansLatinB from '@fontsource/noto-sans/files/noto-sans-latin-700-normal.woff?url';
import sansLatinI from '@fontsource/noto-sans/files/noto-sans-latin-400-italic.woff?url';
import sansLatinBI from '@fontsource/noto-sans/files/noto-sans-latin-700-italic.woff?url';
import sansExtR from '@fontsource/noto-sans/files/noto-sans-latin-ext-400-normal.woff?url';
import sansExtB from '@fontsource/noto-sans/files/noto-sans-latin-ext-700-normal.woff?url';
import sansDevR from '@fontsource/noto-sans/files/noto-sans-devanagari-400-normal.woff?url';
import sansDevB from '@fontsource/noto-sans/files/noto-sans-devanagari-700-normal.woff?url';
import serifLatinR from '@fontsource/noto-serif/files/noto-serif-latin-400-normal.woff?url';
import serifLatinB from '@fontsource/noto-serif/files/noto-serif-latin-700-normal.woff?url';
import serifLatinI from '@fontsource/noto-serif/files/noto-serif-latin-400-italic.woff?url';
import serifLatinBI from '@fontsource/noto-serif/files/noto-serif-latin-700-italic.woff?url';
import monoLatinR from '@fontsource/noto-sans-mono/files/noto-sans-mono-latin-400-normal.woff?url';
import monoLatinB from '@fontsource/noto-sans-mono/files/noto-sans-mono-latin-700-normal.woff?url';

export type Family = 'sans' | 'serif' | 'mono';
export type StyleKey = 'regular' | 'bold' | 'italic' | 'boldItalic';

/** The main (Latin) face for each family and style. Mono has no italic: it reuses the upright faces. */
const LATIN: Record<Family, Record<StyleKey, string>> = {
  sans: { regular: sansLatinR, bold: sansLatinB, italic: sansLatinI, boldItalic: sansLatinBI },
  serif: { regular: serifLatinR, bold: serifLatinB, italic: serifLatinI, boldItalic: serifLatinBI },
  mono: { regular: monoLatinR, bold: monoLatinB, italic: monoLatinR, boldItalic: monoLatinB },
};
/** Extra Latin (for symbols like the rupee sign) and Hindi come from Noto Sans for every family. */
const EXT = { normal: sansExtR, bold: sansExtB };
const DEV = { normal: sansDevR, bold: sansDevB };

const isBold = (s: StyleKey) => s === 'bold' || s === 'boldItalic';

/** What extra fonts a text needs, so we only download them when they are used. */
export function detectNeeds(text: string): { ext: boolean; dev: boolean } {
  const dev = /[ऀ-ॿ᳐-᳿꣠-ꣿ]/.test(text);
  // the Hindi font already has the rupee signs, so they alone do not need the (80 KB) extra Latin font
  const forExt = dev ? text.replace(/[₨₹]/g, '') : text;
  return { dev, ext: /[Ā-ɏḀ-ỿ₠-⃏]/.test(forExt) };
}

const bytesCache = new Map<string, Promise<Uint8Array>>();
const load = (url: string) => {
  let p = bytesCache.get(url);
  if (!p) {
    p = fetch(url).then(async (r) => {
      if (!r.ok) throw new Error(`font ${r.status}`);
      return new Uint8Array(await r.arrayBuffer());
    });
    p.catch(() => bytesCache.delete(url)); // allow a retry after a network error
    bytesCache.set(url, p);
  }
  return p;
};

/** For each style: fonts to try in order, per character (first one that has the glyph wins). */
export type FontChains = Record<StyleKey, PDFFont[]>;

export async function embedFontChains(
  doc: PDFDocument,
  family: Family,
  needs: { ext: boolean; dev: boolean; styles: StyleKey[] },
): Promise<FontChains> {
  doc.registerFontkit(fontkit);
  const embedded = new Map<string, Promise<PDFFont>>();
  const embed = (url: string) => {
    let p = embedded.get(url);
    if (!p) {
      p = load(url).then((bytes) => doc.embedFont(bytes, { subset: true }));
      embedded.set(url, p);
    }
    return p;
  };

  const styles: StyleKey[] = Array.from(new Set<StyleKey>(['regular', ...needs.styles]));
  const out = {} as FontChains;
  for (const style of styles) {
    const urls = [LATIN[family][style]];
    if (needs.ext) urls.push(isBold(style) ? EXT.bold : EXT.normal);
    if (needs.dev) urls.push(isBold(style) ? DEV.bold : DEV.normal);
    out[style] = await Promise.all(urls.map(embed));
  }
  // styles that were not asked for fall back to regular
  for (const s of ['regular', 'bold', 'italic', 'boldItalic'] as StyleKey[]) out[s] ??= out.regular;
  return out;
}
