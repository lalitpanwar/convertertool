/**
 * Page settings shared by the PDF engine AND the live thumbnail preview.
 * Keep this file tiny and dependency-free: it is imported by UI code that
 * loads on page start (the engine itself is lazy-loaded).
 */
export type PageSize = 'a4' | 'letter' | 'fit';
/** The same four choices in every tool that has PDF page options. */
export type Margin = 'none' | 'small' | 'normal' | 'big';
export type Orientation = 'portrait' | 'landscape';

const PAGE_PT: Record<Exclude<PageSize, 'fit'>, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};
const MARGIN_PT: Record<Margin, number> = { none: 0, small: 20, normal: 30, big: 40 };
/** In "fit" mode margin is a share of the image's long side (same look as A4 margins) */
const FIT_MARGIN_FRAC: Record<Margin, number> = { none: 0, small: 20 / 595.28, normal: 30 / 595.28, big: 40 / 595.28 };

export interface PageGeometry {
  pageW: number;
  pageH: number;
  /** margin on every side, same unit as pageW/pageH */
  margin: number;
}

/** Single source of truth for page size + margin for one image. */
export function pageGeometry(
  pageSize: PageSize,
  orientation: Orientation,
  margin: Margin,
  imgW: number,
  imgH: number,
): PageGeometry {
  if (pageSize === 'fit') {
    const m = FIT_MARGIN_FRAC[margin] * Math.max(imgW, imgH);
    return { pageW: imgW + m * 2, pageH: imgH + m * 2, margin: m };
  }
  const [w, h] = PAGE_PT[pageSize];
  const [pageW, pageH] = orientation === 'landscape' ? [h, w] : [w, h];
  return { pageW, pageH, margin: MARGIN_PT[margin] };
}
