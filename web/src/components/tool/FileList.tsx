import { useRef, useState } from 'preact/hooks';
import { buttonClass } from '@/lib/ui/button';
import { formatBytes } from '@/lib/utils';

export interface Item {
  id: string;
  file: File;
  /** object URL for thumbnail (optional) */
  preview?: string;
  /** natural image size (images only), filled in after load */
  w?: number;
  h?: number;
  /** clockwise rotation chosen by the user (images only) */
  rotation?: 0 | 90 | 180 | 270;
}

interface Props {
  items: Item[];
  onMove: (index: number, dir: -1 | 1) => void;
  /** called once when a drag ends on a new position */
  onReorder: (from: number, to: number) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
  /** word before the number in the subtitle: "Page" for images, "File" for PDFs */
  unit?: string;
}

const btn = buttonClass({ variant: 'secondary', size: 'icon' });

function Icon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

interface DragState {
  from: number;
  target: number;
  dy: number;
}

/**
 * Sortable file list. Drag the grip handle (mouse or touch, via pointer events)
 * or use the arrow buttons (keyboard / accessibility).
 */
export default function FileList({ items, onMove, onReorder, onRemove, disabled, unit = 'Page' }: Props) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const rows = useRef<(HTMLLIElement | null)[]>([]);
  const geo = useRef<{ centers: number[]; step: number; startY: number } | null>(null);

  const start = (e: PointerEvent, i: number) => {
    if (disabled || e.button > 0) return;
    const rects = rows.current.map((el) => el!.getBoundingClientRect());
    const step = rects.length > 1 ? rects[1].top - rects[0].top : rects[0].height + 12;
    geo.current = { centers: rects.map((r) => r.top + r.height / 2), step, startY: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ from: i, target: i, dy: 0 });
  };

  const move = (e: PointerEvent) => {
    if (!drag || !geo.current) return;
    const { centers, startY } = geo.current;
    const dy = e.clientY - startY;
    const y = centers[drag.from] + dy;
    let target = 0;
    centers.forEach((c, idx) => {
      if (Math.abs(c - y) < Math.abs(centers[target] - y)) target = idx;
    });
    setDrag({ from: drag.from, target, dy });
  };

  const end = (commit: boolean) => {
    if (drag && commit && drag.target !== drag.from) onReorder(drag.from, drag.target);
    geo.current = null;
    setDrag(null);
  };

  const shift = (i: number): number => {
    if (!drag || !geo.current) return 0;
    const { from, target } = drag;
    if (from < target && i > from && i <= target) return -geo.current.step;
    if (from > target && i < from && i >= target) return geo.current.step;
    return 0;
  };

  return (
    <ul class="grid gap-3" aria-label="Selected files. Drag the handle or use the arrows to reorder.">
      {items.map((it, i) => {
        const dragging = drag?.from === i;
        const y = dragging ? drag!.dy : shift(i);
        return (
          <li
            key={it.id}
            ref={(el) => {
              rows.current[i] = el;
            }}
            style={{
              transform: y ? `translateY(${y}px)` : undefined,
              transition: dragging ? 'none' : 'transform 150ms ease',
            }}
            class={`relative flex items-center gap-2 rounded-card border bg-surface p-2 sm:gap-3 sm:p-3 ${
              dragging ? 'z-20 border-brand shadow-lg' : 'border-border'
            }`}
          >
            <span
              class={`flex h-11 w-7 shrink-0 select-none items-center justify-center rounded-ctl text-muted ${
                disabled ? 'opacity-40' : 'cursor-grab touch-none hover:bg-surface-2 active:cursor-grabbing'
              }`}
              style={{ touchAction: 'none' }}
              aria-hidden="true"
              title="Drag to reorder"
              onPointerDown={(e) => start(e, i)}
              onPointerMove={move}
              onPointerUp={() => end(true)}
              onPointerCancel={() => end(false)}
            >
              <svg width="14" height="22" viewBox="0 0 14 22" fill="currentColor">
                {[3, 11, 19].map((cy) => (
                  <>
                    <circle cx="3" cy={cy} r="1.7" />
                    <circle cx="11" cy={cy} r="1.7" />
                  </>
                ))}
              </svg>
            </span>

            {it.preview ? (
              <img src={it.preview} alt="" width="56" height="56" draggable={false} class="h-14 w-14 shrink-0 rounded-ctl object-cover" />
            ) : (
              <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-ctl bg-brand-soft text-xs font-semibold text-muted" aria-hidden="true">
                {(it.file.name.split('.').pop() ?? '').slice(0, 4).toUpperCase()}
              </div>
            )}
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{it.file.name}</p>
              <p class="text-xs text-muted">
                {unit} {i + 1} · {formatBytes(it.file.size)}
              </p>
            </div>
            <div class="flex shrink-0 gap-1">
              <button type="button" class={btn} disabled={disabled || i === 0} onClick={() => onMove(i, -1)} aria-label={`Move ${it.file.name} up`}>
                <Icon d="M12 19V5M5 12l7-7 7 7" />
              </button>
              <button type="button" class={btn} disabled={disabled || i === items.length - 1} onClick={() => onMove(i, 1)} aria-label={`Move ${it.file.name} down`}>
                <Icon d="M12 5v14M19 12l-7 7-7-7" />
              </button>
              <button type="button" class={btn} disabled={disabled} onClick={() => onRemove(it.id)} aria-label={`Remove ${it.file.name}`}>
                <Icon d="M6 6l12 12M18 6L6 18" />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
