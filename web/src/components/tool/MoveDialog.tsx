import { useEffect, useRef, useState } from 'preact/hooks';
import Button from '@/components/ui/Button';

interface Props {
  /** current index (0-based) */
  from: number;
  total: number;
  name: string;
  /** move to this index (0-based) and close */
  onMove: (to: number) => void;
  onClose: () => void;
}

/**
 * "Move page N" popup: the touch-friendly alternative to dragging.
 * Quick buttons (first / earlier / later / last) or any position from a list.
 */
export default function MoveDialog({ from, total, name, onMove, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [pos, setPos] = useState(from + 1);

  useEffect(() => {
    const dlg = ref.current;
    if (dlg && !dlg.open) dlg.showModal();
  }, []);

  const last = total - 1;

  return (
    <dialog
      ref={ref}
      aria-labelledby="move-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      class="m-auto w-[calc(100%-2rem)] max-w-sm rounded-card bg-surface p-0 text-text shadow-2xl backdrop:bg-black/50"
    >
      <div class="grid gap-4 p-6">
        <div class="text-center">
          <h2 id="move-title" class="text-xl font-bold">
            Move page {from + 1}
          </h2>
          <p class="mt-1 truncate text-sm text-muted" title={name}>
            {name}
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <Button variant="secondary" disabled={from === 0} onClick={() => onMove(0)}>
            To first
          </Button>
          <Button variant="secondary" disabled={from === last} onClick={() => onMove(last)}>
            To last
          </Button>
          <Button variant="secondary" disabled={from === 0} onClick={() => onMove(from - 1)}>
            One earlier
          </Button>
          <Button variant="secondary" disabled={from === last} onClick={() => onMove(from + 1)}>
            One later
          </Button>
        </div>

        <div class="grid gap-2 border-t border-border pt-4">
          <label for="move-pos" class="text-sm font-semibold">
            Or move to position
          </label>
          <div class="flex gap-3">
            <select
              id="move-pos"
              value={pos}
              onChange={(e) => setPos(Number((e.target as HTMLSelectElement).value))}
              class="min-h-11 min-w-0 flex-1 rounded-ctl border border-text/60 bg-surface px-3 text-base"
            >
              {Array.from({ length: total }, (_, k) => (
                <option key={k} value={k + 1}>
                  {k + 1}
                  {k === from ? ' (current)' : ''}
                </option>
              ))}
            </select>
            <Button disabled={pos - 1 === from} onClick={() => onMove(pos - 1)}>
              Move
            </Button>
          </div>
        </div>

        <Button variant="link" onClick={onClose} class="mx-auto">
          Cancel
        </Button>
      </div>
    </dialog>
  );
}
