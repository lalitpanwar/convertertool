import { useEffect, useRef } from 'preact/hooks';
import { DRAFT_WIPE_AFTER_DOWNLOAD_MS, clearIfDownloaded, markDownloaded } from './draft';

/**
 * Call the returned function when the user downloads the result. The saved draft is then
 * marked (so a refresh does not bring it back) and deleted after a few seconds, unless the user
 * keeps editing (a new save cancels the wipe).
 */
export function useDraftWipe(draftKey: string): () => void {
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return () => {
    void markDownloaded(draftKey);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void clearIfDownloaded(draftKey), DRAFT_WIPE_AFTER_DOWNLOAD_MS);
  };
}
