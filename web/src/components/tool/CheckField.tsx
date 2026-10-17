interface Props {
  id: string;
  label: string;
  /** small explanation under the label */
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

/** Checkbox with a label and optional hint. The whole row is the tap target. */
export default function CheckField({ id, label, hint, checked, onChange, disabled }: Props) {
  return (
    <label
      for={id}
      class="flex min-h-11 cursor-pointer items-start gap-3 rounded-ctl py-1 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
        class="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[var(--brand)]"
      />
      <span class="min-w-0">
        <span class="block text-sm font-medium">{label}</span>
        {hint && <span class="mt-0.5 block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}
