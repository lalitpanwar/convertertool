import { useState } from 'preact/hooks';

import { buttonClass } from '@/lib/ui/button';

interface Props {
  accept: string;
  multiple?: boolean;
  /** Main button text, e.g. "Choose photos" */
  label: string;
  hint?: string;
  onFiles: (files: File[]) => void;
  /** Fired on first hover/focus so the caller can prefetch heavy code */
  onIntent?: () => void;
  /** compact = smaller zone once files are already added */
  compact?: boolean;
}

export default function Dropzone({ accept, multiple, label, hint, onFiles, onIntent, compact }: Props) {
  const [over, setOver] = useState(false);

  const handle = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    onFiles(Array.from(list));
  };

  return (
    <label
      class={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed text-center transition-colors focus-within:outline focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-[var(--focus)] ${
        compact ? 'p-4' : 'p-8 sm:p-12'
      } ${over ? 'border-brand bg-brand-soft' : 'border-border bg-surface hover:bg-brand-soft'}`}
      onPointerEnter={onIntent}
      onFocusCapture={onIntent}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
        onIntent?.();
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        handle(e.dataTransfer?.files ?? null);
      }}
    >
      <input
        type="file"
        class="sr-only"
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          handle((e.target as HTMLInputElement).files);
          (e.target as HTMLInputElement).value = ''; // allow re-selecting same file
        }}
      />
      <span class={`${buttonClass({ size: compact ? 'lg' : 'xl' })} ${compact ? '' : 'px-10'}`}>
        {label}
      </span>
      {!compact && <span class="text-sm text-muted">or drop files here</span>}
      {hint && !compact && <span class="text-xs text-muted">{hint}</span>}
    </label>
  );
}
