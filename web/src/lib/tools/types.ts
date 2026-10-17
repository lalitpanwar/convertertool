export type ToolCategory = 'convert' | 'organize' | 'optimize';
export type ToolStatus = 'live' | 'planned';
export type ToolEngine = 'client' | 'server';

/** Key handled in src/components/tool/ToolIsland.astro */
export type IslandKey = 'JpgToPdf' | 'MergePdf' | 'PdfToJpg' | 'TextToPdf';

export interface Faq {
  q: string;
  a: string;
}

export interface ToolDef {
  /** URL slug, e.g. "jpg-to-pdf" -> /jpg-to-pdf */
  slug: string;
  /** Short name used in cards/nav */
  name: string;
  category: ToolCategory;
  status: ToolStatus;
  engine: ToolEngine;
  /** What the tool UI calls the files, e.g. 'photos' (default) or 'images' */
  fileNoun?: string;
  /** Which Preact island renders the tool UI (required when status = live) */
  island?: IslandKey;
  /** <title>, <= 60 chars */
  title: string;
  /** meta description, <= 155 chars */
  description: string;
  /** H1: should match the user's problem/query */
  h1: string;
  /** 1-2 sentence intro under the H1 */
  intro: string;
  /** 3 short steps (also emitted as HowTo schema) */
  steps: string[];
  /** 6-10 items (also emitted as FAQPage schema) */
  faqs: Faq[];
  /** Slugs of related tools for internal links */
  related: string[];
  /** Unique long-form guide, array of paragraphs/headings in simple markup */
  guide?: { heading: string; body: string }[];
}
