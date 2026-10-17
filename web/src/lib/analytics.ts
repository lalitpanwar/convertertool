/**
 * Events for Google Tag Manager (dataLayer). Safe to call always: without GTM it only fills an array.
 * Never put file names, text or any content of the user in an event.
 */
type Params = Record<string, string | number | boolean | undefined>;

export function track(event: string, params: Params = {}) {
  try {
    const w = window as unknown as { dataLayer?: unknown[] };
    (w.dataLayer = w.dataLayer || []).push({ event, ...params });
  } catch {
    /* no window (server build) */
  }
}

/** "/jpg-to-pdf/" -> "jpg-to-pdf" */
export const currentTool = () => {
  try {
    return location.pathname.split('/').filter(Boolean)[0] ?? 'home';
  } catch {
    return 'unknown';
  }
};
