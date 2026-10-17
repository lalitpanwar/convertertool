import { useEffect, useRef, useState } from 'preact/hooks';
import Button from '@/components/ui/Button';
import { formatBytes } from '@/lib/utils';

interface Props {
  url: string;
  filename: string;
  size: number;
  /** extra line, e.g. "5 pages" */
  detail?: string;
  onReset: () => void;
  resetLabel?: string;
  /** headline, e.g. "Success! Your JPG is ready" */
  title?: string;
  /** download button text, e.g. "Download ZIP" */
  buttonLabel?: string;
  /** small explanation under the details (optional) */
  note?: string;
  /** called when the user taps the download button */
  onDownload?: () => void;
  /** shown after the download button was tapped, e.g. a privacy line */
  afterDownload?: string;
}

const CheckIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

/**
 * Success state after a tool finishes: green check + message + Download.
 * On appearing it scrolls itself into view and focuses the Download button,
 * so the user lands exactly where the next action is (Enter/Space downloads).
 */
export default function ResultCard({
  url,
  filename,
  size,
  detail,
  onReset,
  resetLabel = 'Start over',
  title = 'Success! Your PDF is ready',
  buttonLabel = 'Download PDF',
  note,
  onDownload,
  afterDownload,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'center' });
    el.querySelector<HTMLElement>('a[download]')?.focus({ preventScroll: true });
  }, []);

  return (
    <div ref={ref} class="rounded-card border border-success/40 bg-success-soft p-6 text-center sm:p-10" role="status">
      <span class="check-pop mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success text-white shadow-md" aria-hidden="true">
        <CheckIcon />
      </span>
      <p class="mt-4 text-2xl font-bold">{title}</p>
      <p class="mt-1 text-sm text-muted">
        {filename} · {formatBytes(size)}
        {detail ? ` · ${detail}` : ''}
      </p>
      <Button
        href={url}
        download={filename}
        size="xl"
        class="ripple-pulse mt-6 px-10"
        onClick={() => {
          setDownloaded(true);
          onDownload?.();
        }}
      >
        {buttonLabel}
      </Button>
      {note && <p class="mx-auto mt-3 max-w-sm text-xs text-muted">{note}</p>}
      {downloaded && afterDownload && (
        <p class="mx-auto mt-3 max-w-sm text-xs font-medium text-success" role="status">
          {afterDownload}
        </p>
      )}
      <div class="mt-3">
        <Button variant="link" onClick={onReset}>
          {resetLabel}
        </Button>
      </div>
    </div>
  );
}
