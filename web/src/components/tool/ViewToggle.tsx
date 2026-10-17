import type { ComponentChildren } from 'preact';

export interface ViewOption<T extends string> {
  value: T;
  label: string;
  icon: ComponentChildren;
}

interface Props<T extends string> {
  legend: string;
  value: T;
  options: ViewOption<T>[];
  onChange: (v: T) => void;
}

/** Small segmented switch (e.g. Thumbnails | List). */
export default function ViewToggle<T extends string>({ legend, value, options, onChange }: Props<T>) {
  return (
    <div role="radiogroup" aria-label={legend} class="inline-flex rounded-ctl border border-border bg-surface p-0.5 shadow-sm">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            class={`relative inline-flex min-h-8 items-center gap-1 rounded-ctl px-2.5 text-xs font-medium transition-colors after:absolute after:inset-x-0 after:-inset-y-1.5 after:content-[''] sm:min-h-9 sm:gap-1.5 sm:px-3 sm:text-sm ${
              on ? 'bg-neutral text-on-neutral' : 'text-text hover:bg-surface-2 active:bg-neutral active:text-on-neutral'
            }`}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
