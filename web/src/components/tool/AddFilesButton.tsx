import { buttonClass } from '@/lib/ui/button';

interface Props {
  accept: string;
  multiple?: boolean;
  label: string;
  onFiles: (files: File[]) => void;
  onIntent?: () => void;
  disabled?: boolean;
}

/** Compact "add more files" button (a label wrapping a hidden file input). */
export default function AddFilesButton({ accept, multiple, label, onFiles, onIntent, disabled }: Props) {
  return (
    <label
      class={`${buttonClass()} cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)] ${
        disabled ? 'pointer-events-none opacity-50' : ''
      }`}
      onPointerEnter={onIntent}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
      {label}
      <input
        type="file"
        class="sr-only"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          const input = e.target as HTMLInputElement;
          if (input.files?.length) onFiles(Array.from(input.files));
          input.value = '';
        }}
      />
    </label>
  );
}
