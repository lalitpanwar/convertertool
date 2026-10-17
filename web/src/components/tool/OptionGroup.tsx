interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  legend: string;
  name: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  disabled?: boolean;
  /** small note under the buttons */
  hint?: string;
}

/**
 * Compact one-tap choice (replaces dropdowns): equal-width buttons in one row, the chosen one is
 * highlighted and the setting applies at once. Keep labels short (a number, "A4", "Normal").
 */
export default function OptionGroup<T extends string>({ legend, name, value, options, onChange, disabled, hint }: Props<T>) {
  return (
    <fieldset class="min-w-0" disabled={disabled}>
      <legend class="mb-1.5 text-sm font-semibold">{legend}</legend>
      <div class={`grid gap-1.5 ${disabled ? 'opacity-50' : ''}`} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((o) => {
          const on = value === o.value;
          return (
            <label
              key={o.value}
              class={`flex min-h-10 cursor-pointer select-none items-center justify-center rounded-ctl border px-1 text-center text-xs font-medium leading-tight transition-colors active:duration-75 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)] sm:text-sm ${
                on ? 'border-brand bg-brand-soft font-semibold text-brand' : 'border-border bg-surface hover:bg-surface-2 active:bg-border'
              }`}
            >
              <input type="radio" class="sr-only" name={name} value={o.value} checked={on} onChange={() => onChange(o.value)} />
              {o.label}
            </label>
          );
        })}
      </div>
      {hint && <p class="mt-1.5 text-xs text-muted">{hint}</p>}
    </fieldset>
  );
}
