interface Props {
  /** 0..1 */
  value: number;
  label?: string;
}

export default function ProgressBar({ value, label = 'Working' }: Props) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <div class="h-3 w-full overflow-hidden rounded-ctl bg-surface-2">
        <div class="h-full rounded-ctl bg-link transition-[width] duration-200" style={{ width: `${pct}%` }} />
      </div>
      <p class="mt-1 text-xs text-muted">
        {label}… {pct}%
      </p>
    </div>
  );
}
