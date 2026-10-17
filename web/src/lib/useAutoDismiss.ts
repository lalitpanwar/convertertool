import { useEffect } from 'preact/hooks';

/** How long a "we brought back your files" style note stays on screen. */
export const NOTE_VISIBLE_MS = 8000;

/**
 * Calls `dismiss` a few seconds after `active` becomes true (use it for notes that should
 * fade away on their own). The timer restarts whenever `active` turns true again.
 */
export function useAutoDismiss(active: boolean, dismiss: () => void, ms = NOTE_VISIBLE_MS): void {
  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(dismiss, ms);
    return () => clearTimeout(timer);
  }, [active]);
}
