/**
 * Text to PDF settings: types and defaults. Dependency-free on purpose, so the page UI can
 * import it without pulling the (large, lazy) PDF engine into the initial JavaScript.
 */
import type { Margin } from './page-config';

export type Family = 'sans' | 'serif' | 'mono';

export type TextPageSize = 'a4' | 'letter';
export type TextOrientation = 'portrait' | 'landscape';
export type TextMargin = Margin;
export type TextAlign = 'left' | 'justify';

export interface TextPdfOptions {
  /** optional heading at the top of the first page */
  title: string;
  font: Family;
  /** pt */
  fontSize: number;
  /** line height as a multiple of the font size */
  lineSpacing: number;
  pageSize: TextPageSize;
  orientation: TextOrientation;
  margin: TextMargin;
  align: TextAlign;
  pageNumbers: boolean;
  /** headings (#), lists, quotes, code, **bold**, *italic* */
  markdown: boolean;
}

export const DEFAULT_TEXT_OPTIONS: TextPdfOptions = {
  title: '',
  font: 'sans',
  fontSize: 12,
  lineSpacing: 1.5,
  pageSize: 'a4',
  orientation: 'portrait',
  margin: 'normal',
  align: 'left',
  pageNumbers: true,
  markdown: false,
};
