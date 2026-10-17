/**
 * Simple 24x24 stroke icon paths, one per tool slug (own drawings, no brand assets).
 * New tool: add a path here. Falls back to `fallback`.
 */
export const TOOL_ICONS: Record<string, string> = {
  'jpg-to-pdf': 'M4 5h16v14H4z M8.5 10.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z M4 17l5-5 4 4 3-3 4 4',
  'image-to-pdf': 'M4 5h16v14H4z M8.5 10.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z M4 17l5-5 4 4 3-3 4 4',
  'text-to-pdf': 'M5 5h14 M12 5v14 M8.5 19h7',
  'merge-pdf': 'M12 3l9 5-9 5-9-5 9-5z M3 13l9 5 9-5',
  'compress-pdf': 'M4 14h6v6 M20 10h-6V4 M14 10l7-7 M3 21l7-7',
  'pdf-to-jpg': 'M12 3v12 M7 11l5 5 5-5 M5 21h14',
  'split-pdf': 'M12 3v18 M6 8l-4 4 4 4 M18 8l4 4-4 4',
};

export const fallbackIcon = 'M6 3h9l5 5v13H6z M14 3v6h6';
