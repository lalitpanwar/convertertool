import type { ToolDef } from './types';
import { jpgToPdf } from './defs/jpg-to-pdf';
import { imageToPdf } from './defs/image-to-pdf';
import { mergePdf } from './defs/merge-pdf';
import { pdfToJpg } from './defs/pdf-to-jpg';
import { textToPdf } from './defs/text-to-pdf';
import { plannedTools } from './defs/planned';

/**
 * Single source of truth for all tools. Pages, nav, sitemap, schema and
 * related links are generated from this list. Order = display order.
 */
export const TOOLS: ToolDef[] = [jpgToPdf, imageToPdf, mergePdf, pdfToJpg, textToPdf, ...plannedTools];

export const liveTools = (): ToolDef[] => TOOLS.filter((t) => t.status === 'live');

export const getTool = (slug: string): ToolDef | undefined => TOOLS.find((t) => t.slug === slug);

export const relatedTools = (tool: ToolDef): ToolDef[] =>
  tool.related.map(getTool).filter((t): t is ToolDef => Boolean(t));
