export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Return a copy of `list` with the item at `from` moved to index `to`. */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
}

/** Sort by file name, natural order (img2 before img10). */
export function sortByName<T extends { file: { name: string } }>(list: T[], dir: 'asc' | 'desc'): T[] {
  const sign = dir === 'asc' ? 1 : -1;
  return [...list].sort((a, b) => sign * a.file.name.localeCompare(b.file.name, undefined, { numeric: true, sensitivity: 'base' }));
}

/** Resolve once at least `ms` have passed since `since` (a performance.now() value). Stops "busy" popups from flashing. */
export const holdUntil = (since: number, ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, Math.max(0, ms - (performance.now() - since))));
