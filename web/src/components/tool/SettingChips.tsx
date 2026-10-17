import type { ComponentChildren } from 'preact';

/**
 * EXTRA SETTINGS as a horizontal strip of small icon + chip groups, placed INSIDE the work area, right
 * on top of the thing they change (the text editor, the page grid). `embedded` makes it the toolbar of a card. Phones/tablets: one row that scrolls sideways. Desktop: the groups wrap onto
 * as many rows as needed (no scrolling). Tap a chip and the setting applies at once.
 *
 *   <SettingsStrip>
 *     <SelectChip legend="Font size" icon={<FontSizeIcon />} ... />   (many choices: a dropdown)
 *     <ChipGroup ... />                                              (2-3 icon-only choices)
 *     <ToggleChip label="Markdown" icon={<MarkdownIcon />} ... />   (on/off)
 *   </SettingsStrip>
 */
export function SettingsStrip({ children, embedded }: { children: ComponentChildren; embedded?: boolean }) {
  return (
    <div
      role="group"
      aria-label="Settings (scroll sideways for more)"
      class={`flex snap-x items-center gap-2 overflow-x-auto [scrollbar-width:thin] lg:flex-wrap lg:overflow-visible ${
        embedded ? 'bg-surface-2 p-1.5' : '-mx-1 px-1 pb-1.5 lg:mx-0 lg:px-0 lg:pb-0'
      }`}
    >
      {children}
    </div>
  );
}

// the capsule around one setting: small icon + (name on wider screens) + its chips
// `relative` matters: the hidden legend/radio inputs are absolutely positioned and must be clipped by the
// scrolling strip (otherwise they stretch the whole page sideways)
const CAPSULE =
  'relative flex shrink-0 snap-start items-center gap-1 rounded-card bg-surface p-1 ring-1 ring-border';
const CAPTION = 'flex shrink-0 items-center gap-1 px-1.5 text-muted';
const CAPTION_TEXT = 'hidden text-xs font-semibold sm:inline';

const chip = (on: boolean) =>
  `relative inline-flex min-h-8 min-w-8 cursor-pointer select-none items-center justify-center gap-1 rounded-ctl px-2.5 text-xs font-medium leading-none transition-colors active:duration-75 after:absolute after:inset-x-0 after:-inset-y-1 after:content-[''] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-[var(--focus)] lg:min-h-9 ${
    on ? 'bg-brand-soft text-brand ring-1 ring-brand' : 'text-text hover:bg-surface-2 active:bg-border'
  }`;

export interface ChipOption<T extends string> {
  value: T;
  label: string;
  icon?: ComponentChildren;
  /** show only the icon (the label stays for screen readers) */
  iconOnly?: boolean;
  /** extra classes for the label, e.g. a font family */
  labelClass?: string;
}

interface GroupProps<T extends string> {
  legend: string;
  icon: ComponentChildren;
  name: string;
  value: T;
  options: ChipOption<T>[];
  onChange: (v: T) => void;
  disabled?: boolean;
  /** extra explanation, shown as a tooltip */
  hint?: string;
}

export function ChipGroup<T extends string>({ legend, icon, name, value, options, onChange, disabled, hint }: GroupProps<T>) {
  return (
    <fieldset class={`${CAPSULE} min-w-0 ${disabled ? 'opacity-50' : ''}`} disabled={disabled} title={hint ? `${legend}. ${hint}` : legend}>
      <legend class="sr-only">{legend}</legend>
      <span class={CAPTION} aria-hidden="true">
        {icon}
        <span class={CAPTION_TEXT}>{legend}</span>
      </span>
      <div class="flex gap-1 lg:flex-wrap">
        {options.map((o) => {
          const on = value === o.value;
          return (
            <label key={o.value} class={chip(on)} title={o.label}>
              <input type="radio" class="sr-only" name={name} value={o.value} checked={on} onChange={() => onChange(o.value)} aria-label={o.label} />
              {o.icon}
              {!o.iconOnly && <span class={o.labelClass}>{o.label}</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

interface SelectProps<T extends string> {
  legend: string;
  /** small icon in front (may change with the value) */
  icon: ComponentChildren;
  name: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  disabled?: boolean;
  /** extra explanation, shown as a tooltip */
  hint?: string;
}

/**
 * A setting with many choices as a compact dropdown (small icon + name + the current value).
 * On phones it opens the phone's own picker; picking a value applies it at once.
 */
export function SelectChip<T extends string>({ legend, icon, name, value, options, onChange, disabled, hint }: SelectProps<T>) {
  return (
    <label
      class={`${CAPSULE} min-w-0 cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-[var(--focus)] ${disabled ? 'opacity-50' : ''}`}
      title={hint ? `${legend}. ${hint}` : legend}
    >
      <span class={CAPTION} aria-hidden="true">
        {icon}
        <span class={CAPTION_TEXT}>{legend}</span>
      </span>
      <span class="relative inline-flex">
        <select
          name={name}
          aria-label={legend}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange((e.target as HTMLSelectElement).value as T)}
          class="min-h-8 cursor-pointer appearance-none rounded-ctl bg-surface-2 py-1 pl-2.5 pr-7 text-xs font-semibold text-text hover:bg-border focus:outline-none active:bg-border lg:min-h-9"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </span>
    </label>
  );
}

interface ToggleProps {
  id: string;
  label: string;
  icon: ComponentChildren;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  /** extra explanation, shown as a tooltip */
  hint?: string;
}

/** An on/off setting as one chip (Markdown, page numbers...). */
export function ToggleChip({ id, label, icon, checked, onChange, disabled, hint }: ToggleProps) {
  return (
    <div class={`${CAPSULE} ${disabled ? 'opacity-50' : ''}`}>
      <label for={id} class={chip(checked)} title={hint ? `${label}: ${hint}` : label}>
        <input id={id} type="checkbox" class="sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange((e.target as HTMLInputElement).checked)} />
        {icon}
        <span>{label}</span>
      </label>
    </div>
  );
}

/** A capsule holding a few icon buttons (formatting toolbar: bold, italic, lists...). */
export function ToolGroup({ label, children }: { label: string; children: ComponentChildren }) {
  return (
    <div role="group" aria-label={label} class={`${CAPSULE} gap-0.5`}>
      {children}
    </div>
  );
}

interface ToolButtonProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
  children: ComponentChildren;
}

/** One icon button of a ToolGroup. It never takes focus from the editor, so the selection stays. */
export function ToolButton({ label, active, disabled, onPress, children }: ToolButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPress}
      class={`relative inline-flex min-h-8 min-w-8 items-center justify-center rounded-ctl text-sm leading-none transition-colors active:duration-75 after:absolute after:inset-x-0 after:-inset-y-1 after:content-[''] disabled:opacity-50 lg:min-h-9 lg:min-w-9 ${
        active ? 'bg-neutral text-on-neutral' : 'text-text hover:bg-surface-2 active:bg-border'
      }`}
    >
      {children}
    </button>
  );
}
