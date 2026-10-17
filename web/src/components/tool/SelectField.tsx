interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  label: string;
  id: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  disabled?: boolean;
}

/** Labeled native <select> (best on mobile: uses the OS picker). */
export default function SelectField<T extends string>({ label, id, value, options, onChange, disabled }: Props<T>) {
  return (
    <div>
      <label for={id} class="mb-3 block text-base font-semibold">
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange((e.target as HTMLSelectElement).value as T)}
        class="min-h-12 w-full rounded-ctl border border-text/60 bg-surface px-3 text-base"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
