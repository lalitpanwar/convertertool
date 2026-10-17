import { useEffect, useRef } from 'preact/hooks';

interface Props {
  /** e.g. "Converting your photos…" */
  title: string;
  /** 0..1 */
  progress: number;
  note?: string;
}

/**
 * Centered "working" popup shown while a tool processes files: spinner, title,
 * progress bar and percent. Modal (native <dialog>) so nothing else can be
 * clicked meanwhile; Esc is ignored on purpose.
 */
export default function BusyDialog({ title, progress, note }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = ref.current;
    if (dlg && !dlg.open) dlg.showModal();
  }, []);

  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);

  return (
    <dialog
      ref={ref}
      aria-labelledby="busy-title"
      onCancel={(e) => e.preventDefault()}
      class="m-auto w-[calc(100%-2rem)] max-w-xs rounded-card bg-surface p-0 text-text shadow-2xl backdrop:bg-black/50"
    >
      <div class="grid justify-items-center gap-4 p-8 text-center" role="status" aria-live="polite">
        <span class="block h-14 w-14 animate-spin rounded-full border-4 border-border border-t-brand" aria-hidden="true" />
        <h2 id="busy-title" class="text-xl font-bold">
          {title}
        </h2>
        <div class="w-full" role="progressbar" aria-label={title} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
          <div class="h-2.5 w-full overflow-hidden rounded-ctl bg-surface-2">
            <div class="h-full rounded-ctl bg-brand transition-[width] duration-200" style={{ width: `${pct}%` }} />
          </div>
          <p class="mt-2 text-sm font-medium">{pct}%</p>
        </div>
        {note && <p class="text-sm text-muted">{note}</p>}
      </div>
    </dialog>
  );
}
