import { useEffect, useRef, useState } from 'preact/hooks';
import Button from '@/components/ui/Button';
import { formatBytes } from '@/lib/utils';

interface Props {
  file: File;
  /** how many more duplicates are waiting after this one */
  more: number;
  /** "Yes, I want it": add the duplicate anyway */
  onKeep: () => void;
  /** "Delete": skip the duplicate (also Esc) */
  onDelete: () => void;
}

/**
 * Centered modal (native <dialog>: focus trap, Esc, backdrop) shown when the
 * user adds an image that is already in the list.
 */
export default function DuplicateDialog({ file, more, onKeep, onDelete }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [src, setSrc] = useState('');

  useEffect(() => {
    const dlg = ref.current;
    if (dlg && !dlg.open) dlg.showModal();
  }, []);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="dup-title"
      onCancel={(e) => {
        e.preventDefault();
        onDelete();
      }}
      class="m-auto w-[calc(100%-2rem)] max-w-md rounded-card bg-surface p-0 text-text shadow-2xl backdrop:bg-black/50"
    >
      <div class="grid gap-4 p-6 text-center">
        <h2 id="dup-title" class="text-xl font-bold">
          Duplicate image
        </h2>
        {src && <img src={src} alt="" class="mx-auto max-h-40 rounded-ctl object-contain ring-1 ring-border" />}
        <p class="text-sm text-muted">
          <span class="font-medium text-text">{file.name}</span> ({formatBytes(file.size)}) is already in your list. Do you want to add it again?
        </p>
        {more > 0 && <p class="text-xs text-muted">{more} more duplicate{more === 1 ? '' : 's'} to review after this.</p>}
        <div class="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" onClick={onKeep}>
            Yes, I want it
          </Button>
          <Button size="lg" variant="secondary" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>
    </dialog>
  );
}
