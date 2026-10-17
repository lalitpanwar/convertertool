import type { ToolDef } from '../types';

/**
 * Wave 1 tools that are not built yet (docs/09, docs/10).
 * When building one: move it to its own file in this folder, set status 'live',
 * set `island`, fill steps/faqs/guide. See docs/11-dev-guide.md "Add a new tool".
 */
const stub = (
  slug: string,
  name: string,
  category: ToolDef['category'],
  h1: string,
  related: string[],
): ToolDef => ({
  slug,
  name,
  category,
  status: 'planned',
  engine: 'client',
  title: `${name} Free Online`,
  description: `${name}: coming soon.`,
  h1,
  intro: '',
  steps: [],
  faqs: [],
  related,
});

export const plannedTools: ToolDef[] = [
  stub('compress-pdf', 'Compress PDF', 'optimize', 'Reduce PDF size', ['jpg-to-pdf', 'merge-pdf']),
  stub('split-pdf', 'Split PDF', 'organize', 'Split a PDF into separate files', ['merge-pdf', 'compress-pdf']),
];
