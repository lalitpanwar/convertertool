import type { ComponentChildren } from 'preact';

export interface TileOption<T extends string> {
  value: T;
  label: string;
  icon: ComponentChildren;
}

interface Props<T extends string> {
  legend: string;
  name: string;
  value: T;
  options: TileOption<T>[];
  onChange: (v: T) => void;
  disabled?: boolean;
  /** small note under the tiles, e.g. why they are disabled */
  hint?: string;
}

/**
 * Compact icon tiles (orientation, margins, font, alignment): tap an icon and the setting applies.
 * Selected tile: brand border + brand text. Others: soft grey. Small on purpose (about 56px high),
 * so several groups fit on a phone screen.
 */
export default function TileGroup<T extends string>({ legend, name, value, options, onChange, disabled, hint }: Props<T>) {
  return (
    <fieldset class="min-w-0" disabled={disabled}>
      <legend class="mb-1.5 text-sm font-semibold">{legend}</legend>
      <div class={`grid gap-1.5 ${disabled ? 'opacity-50' : ''}`} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((o) => {
          const on = value === o.value;
          return (
            <label
              key={o.value}
              class={`flex min-h-14 cursor-pointer select-none flex-col items-center justify-center gap-0.5 rounded-card border-2 px-1 py-1.5 text-center text-[11px] leading-tight transition-colors active:duration-75 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)] sm:text-xs ${
                on ? 'border-brand bg-surface text-brand' : 'border-transparent bg-surface-2 text-muted hover:bg-border active:bg-border'
              }`}
            >
              <input type="radio" class="sr-only" name={name} value={o.value} checked={on} onChange={() => onChange(o.value)} />
              <span class="flex h-6 w-6 items-center justify-center [&_svg]:h-6 [&_svg]:w-6" aria-hidden="true">
                {o.icon}
              </span>
              <span class="font-medium">{o.label}</span>
            </label>
          );
        })}
      </div>
      {hint && <p class="mt-1.5 text-xs text-muted">{hint}</p>}
    </fieldset>
  );
}
