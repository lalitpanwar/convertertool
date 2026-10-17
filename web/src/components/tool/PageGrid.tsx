import { useEffect, useRef, useState } from 'preact/hooks';
import { buttonClass } from '@/lib/ui/button';
import type { Item } from './item';
import MoveDialog from './MoveDialog';
import { formatBytes } from '@/lib/utils';
import { RotateIcon } from './tile-icons';

export type ViewMode = 'grid' | 'list';

/** How one item's page should look in the preview. */
export interface PageLook {
  /** page width / height */
  aspect: number;
  /** margin as % of page width (CSS padding %) */
  padPct: number;
}

interface Props {
  items: Item[];
  /** page preview for an item; changes live with the options panel */
  look: (item: Item) => PageLook;
  onReorder: (from: number, to: number) => void;
  onRemove: (id: string) => void;
  /** rotate 90 degrees clockwise (omit for files that cannot be rotated, like PDFs) */
  onRotate?: (id: string) => void;
  /** what the cards are, for screen readers: 'images' (default) or 'PDFs' */
  noun?: string;
  /** thumbnails (grid) or one row per image (list) */
  view: ViewMode;
  /** cards to highlight for a moment: just added, or just moved */
  flash?: { ids: string[]; kind: 'added' | 'moved'; token: number } | null;
  /** images the browser cannot open (id -> reason): shown with a red mark */
  bad?: Record<string, string>;
  disabled?: boolean;
}

interface DragState {
  from: number;
  target: number;
  dx: number;
  dy: number;
}

interface Geo {
  from: number;
  rects: DOMRect[];
  startX: number;
  startY: number;
  startScroll: number;
  /** top-left of the scroll area on screen when the drag began */
  originLeft: number;
  originTop: number;
  /** real end of the list, measured before the dragged card can stretch it */
  maxScroll: number;
}

const EDGE = 56; // px from the top/bottom of the scroll area that triggers auto-scroll
const SCROLL_SPEED = 14;
const LONG_PRESS = 220; // ms a finger must stay down on a card before a drag starts
const HOLD_TOLERANCE = 8; // px of finger movement that means "scroll", not "hold"

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

/** Shown instead of the picture when the browser cannot open the file. */
const ProblemMark = () => (
  <span class="m-auto flex h-8 w-8 items-center justify-center rounded-ctl bg-danger text-lg font-bold text-white" aria-hidden="true">
    !
  </span>
);

const Spinner = () => (
  <span class="m-auto block h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-hidden="true" />
);

/**
 * While a finger drags a card the page must not scroll under it.
 * These two MUST be module-level (stable identity): a function created inside the
 * component is a new function on every render, so removeEventListener would not find
 * the one that was added and the page would stay frozen after the first drag.
 */
function blockTouchScroll(ev: TouchEvent) {
  if (ev.cancelable) ev.preventDefault();
}
function unlockTouchScroll() {
  window.removeEventListener('touchmove', blockTouchScroll);
}

/**
 * Scrollable grid of page thumbnails (vertical scroll when there are more rows
 * than fit). Drag a card (mouse: anywhere, touch: the grip) to reorder; the
 * order number in the top-left corner updates live and the list auto-scrolls
 * near its edges. Keyboard: focus the grip and press arrow keys.
 */
export default function PageGrid({ items, look, onReorder, onRemove, onRotate, noun = 'images', view, flash, bad, disabled }: Props) {
  const [drag, setDrag] = useState<DragState | null>(null);
  /** index of the card whose "Move page" popup is open */
  const [moving, setMoving] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLLIElement | null)[]>([]);
  const geo = useRef<Geo | null>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const timer = useRef<number | null>(null);
  /** a finger is down on a card body and we are waiting to see: hold (drag) or swipe (scroll)? */
  const pending = useRef<{ timer: number; x: number; y: number } | null>(null);

  const stopScroll = () => {
    if (timer.current !== null) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };
  const cancelPending = () => {
    if (pending.current) {
      clearTimeout(pending.current.timer);
      pending.current = null;
    }
  };
  useEffect(
    () => () => {
      stopScroll();
      cancelPending();
      unlockTouchScroll();
    },
    [],
  );

  /** After adding or moving, bring the highlighted card into the visible part of the list. */
  useEffect(() => {
    if (!flash) return;
    const idx = items.findIndex((x) => x.id === flash.ids[0]);
    const el = cards.current[idx];
    const box = scroller.current;
    if (!el || !box) return;
    const er = el.getBoundingClientRect();
    const br = box.getBoundingClientRect();
    if (er.top < br.top || er.bottom > br.bottom) {
      const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      box.scrollTo({ top: box.scrollTop + (er.top - br.top) - 8, behavior: calm ? 'auto' : 'smooth' });
    }
  }, [flash?.token]);

  /** Work out the drag offset and the slot under the dragged card. */
  const recalc = () => {
    const g = geo.current;
    const box = scroller.current;
    if (!g || !box) return;
    const dx = pointer.current.x - g.startX;
    // the card lives inside the scrolling content, so scrolling moves it too
    const dy = pointer.current.y - g.startY + (box.scrollTop - g.startScroll);
    const r = g.rects[g.from];
    const cx = r.left + r.width / 2 + dx;
    const cy = r.top + r.height / 2 + dy;
    let target = g.from;
    let best = Infinity;
    g.rects.forEach((q, idx) => {
      const d = Math.hypot(q.left + q.width / 2 - cx, q.top + q.height / 2 - cy);
      if (d < best) {
        best = d;
        target = idx;
      }
    });
    setDrag({ from: g.from, target, dx, dy });
  };

  const autoScroll = () => {
    const box = scroller.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const y = pointer.current.y;
    const dir = y < rect.top + EDGE ? -1 : y > rect.bottom - EDGE ? 1 : 0;
    if (dir === 0) return stopScroll();
    if (timer.current !== null) return;
    timer.current = window.setInterval(() => {
      const b = scroller.current;
      if (!b) return;
      const r = b.getBoundingClientRect();
      const py = pointer.current.y;
      const d = py < r.top + EDGE ? -1 : py > r.bottom - EDGE ? 1 : 0;
      if (d === 0) return stopScroll();
      const max = geo.current?.maxScroll ?? b.scrollHeight - b.clientHeight;
      b.scrollTop = Math.max(0, Math.min(max, b.scrollTop + d * SCROLL_SPEED));
      recalc();
    }, 16);
  };

  /** Start dragging card i from the pointer position (x, y). */
  const begin = (i: number, x: number, y: number, target: HTMLElement, pointerId: number) => {
    pointer.current = { x, y };
    const area = scroller.current?.getBoundingClientRect();
    geo.current = {
      from: i,
      rects: cards.current.map((c) => c!.getBoundingClientRect()),
      startX: x,
      startY: y,
      startScroll: scroller.current?.scrollTop ?? 0,
      originLeft: area?.left ?? 0,
      originTop: area?.top ?? 0,
      maxScroll: scroller.current ? scroller.current.scrollHeight - scroller.current.clientHeight : 0,
    };
    try {
      target.setPointerCapture(pointerId);
    } catch {
      /* pointer already gone */
    }
    window.addEventListener('touchmove', blockTouchScroll, { passive: false });
    // failsafe: whatever happens to the card, lifting the finger always gives scrolling back
    window.addEventListener('touchend', unlockTouchScroll, { once: true });
    window.addEventListener('touchcancel', unlockTouchScroll, { once: true });
    navigator.vibrate?.(10);
    setDrag({ from: i, target: i, dx: 0, dy: 0 });
  };

  /**
   * Drag works from anywhere on a card.
   * Mouse: starts at once.
   * Finger on the card body: press and hold ~0.2s to start, a quick swipe just scrolls.
   */
  const start = (e: PointerEvent, i: number) => {
    if (disabled || e.button > 0) return;
    const el = e.target as HTMLElement;
    if (el.closest('button')) return;
    const target = e.currentTarget as HTMLElement;
    pointer.current = { x: e.clientX, y: e.clientY };
    if (e.pointerType === 'mouse') {
      begin(i, e.clientX, e.clientY, target, e.pointerId);
      return;
    }
    cancelPending();
    const pointerId = e.pointerId;
    pending.current = {
      x: e.clientX,
      y: e.clientY,
      timer: window.setTimeout(() => {
        pending.current = null;
        begin(i, pointer.current.x, pointer.current.y, target, pointerId);
      }, LONG_PRESS),
    };
  };

  const move = (e: PointerEvent) => {
    pointer.current = { x: e.clientX, y: e.clientY };
    if (pending.current) {
      // moved before the hold finished: the user is scrolling, not dragging
      if (Math.hypot(e.clientX - pending.current.x, e.clientY - pending.current.y) > HOLD_TOLERANCE) cancelPending();
      return;
    }
    if (!geo.current) return;
    recalc();
    autoScroll();
  };

  const end = (commit: boolean) => {
    cancelPending();
    stopScroll();
    unlockTouchScroll();
    if (drag && commit && drag.target !== drag.from) onReorder(drag.from, drag.target);
    geo.current = null;
    setDrag(null);
  };

  /** Where card i sits while another card is being dragged (slot index). */
  const slotOf = (i: number): number => {
    if (!drag) return i;
    const { from, target } = drag;
    if (i === from) return target;
    if (from < target && i > from && i <= target) return i - 1;
    if (from > target && i < from && i >= target) return i + 1;
    return i;
  };

  const offset = (i: number): { x: number; y: number } => {
    if (!drag || !geo.current) return { x: 0, y: 0 };
    if (i === drag.from) return { x: drag.dx, y: drag.dy };
    const slot = slotOf(i);
    if (slot === i) return { x: 0, y: 0 };
    const { rects } = geo.current;
    return { x: rects[slot].left - rects[i].left, y: rects[slot].top - rects[i].top };
  };

  const key = (e: KeyboardEvent, i: number) => {
    if (disabled) return;
    const back = e.key === 'ArrowLeft' || e.key === 'ArrowUp';
    const fwd = e.key === 'ArrowRight' || e.key === 'ArrowDown';
    if (!back && !fwd) return;
    e.preventDefault();
    const to = i + (back ? -1 : 1);
    if (to >= 0 && to < items.length) onReorder(i, to);
  };

  const list = view === 'list';

  const numberButton = (i: number, number: number, place: string) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setMoving(i)}
      aria-label={`Page ${number}. Tap to move it to another position`}
      title="Tap to move"
      class={`${place} flex h-7 min-w-7 items-center justify-center gap-0.5 rounded-ctl bg-neutral px-1.5 text-xs font-bold text-on-neutral shadow after:absolute after:-inset-2 after:content-[''] hover:bg-neutral-hover active:scale-95 active:bg-neutral-hover disabled:opacity-60 sm:h-8 sm:min-w-8 sm:text-sm`}
    >
      {number}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M7 9l5-5 5 5M7 15l5 5 5-5" />
      </svg>
    </button>
  );

  const removeButton = (it: Item, place: string, size: 'icon' | 'iconSm') => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onRemove(it.id)}
      aria-label={`Remove ${it.file.name}`}
      class={`${buttonClass({ variant: 'secondary', size })} ${place}`}
    >
      <XIcon />
    </button>
  );

  const rotateButton = (it: Item) =>
    !onRotate ? null : (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onRotate(it.id)}
      aria-label={`Rotate ${it.file.name} by 90 degrees`}
      title="Rotate 90°"
      class={`${buttonClass({ variant: 'secondary', size: 'icon' })} shrink-0`}
    >
      <RotateIcon />
    </button>
  );

  return (
    <div ref={scroller} class="relative isolate max-h-[70vh] overflow-y-auto p-1" data-testid="page-scroll">
      {drag && geo.current && drag.target !== drag.from && (
        <div
          aria-hidden="true"
          class="pointer-events-none absolute rounded-card border-2 border-dashed border-brand bg-brand-soft/70"
          style={{
            left: `${geo.current.rects[drag.target].left - geo.current.originLeft}px`,
            top: `${geo.current.rects[drag.target].top - geo.current.originTop + geo.current.startScroll}px`,
            width: `${geo.current.rects[drag.target].width}px`,
            height: `${geo.current.rects[drag.target].height}px`,
          }}
        />
      )}
      <ul
        class={
          list
            ? 'grid grid-cols-[minmax(0,1fr)] gap-2'
            : 'grid grid-cols-2 items-start gap-3 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] sm:gap-4'
        }
        aria-label={`Your ${noun} in order. Drag to reorder.`}
        data-view={view}
      >
        {items.map((it, i) => {
          const dragging = drag?.from === i;
          const { x, y } = offset(i);
          const { aspect, padPct } = look(it);
          const number = (drag ? slotOf(i) : i) + 1;
          const flashing = !!flash?.ids.includes(it.id);
          const problem = !!bad?.[it.id];
          const flashLabel = flash?.kind === 'added' ? 'New' : 'Moved';
          const common = {
            'data-name': it.file.name,
            tabIndex: disabled ? -1 : 0,
            'aria-label': `${it.file.name}. Position ${number} of ${items.length}. Use arrow keys to move it.`,
            onKeyDown: (e: KeyboardEvent) => {
              if (e.target === e.currentTarget) key(e, i);
            },
            onPointerDown: (e: PointerEvent) => start(e, i),
            onPointerMove: move,
            onPointerUp: () => end(true),
            onPointerCancel: () => end(false),
            onContextMenu: (e: Event) => {
              if (geo.current || pending.current || (e as PointerEvent).pointerType === 'touch') e.preventDefault();
            },
            style: {
              transform:
                [x || y ? `translate(${x}px, ${y}px)` : '', dragging ? 'scale(1.03) rotate(1deg)' : ''].filter(Boolean).join(' ') || undefined,
              transition: dragging ? 'none' : 'transform 160ms ease',
              zIndex: dragging ? 30 : undefined,
            },
          };
          const surface = dragging ? 'bg-surface shadow-2xl ring-2 ring-brand' : problem ? 'bg-danger-soft outline outline-2 outline-danger' : flashing ? 'flash-card bg-success-soft' : 'bg-surface-2';
          const cursor = disabled ? '' : 'sm:cursor-grab sm:active:cursor-grabbing';

          if (list) {
            // One row per image: big drag handle on the left, easy to hit with a thumb.
            const box = aspect >= 1 ? { width: '100%' } : { height: '100%' };
            return (
              <li
                key={it.id}
                ref={(el) => {
                  cards.current[i] = el;
                }}
                {...common}
                class={`relative flex select-none items-center [-webkit-touch-callout:none] gap-1.5 rounded-card p-1.5 sm:gap-2 sm:p-2 ${cursor} ${surface}`}
              >
                {numberButton(i, number, 'relative shrink-0')}
                <div class="flex h-12 w-12 shrink-0 items-center justify-center sm:h-16 sm:w-16">
                  <div class="flex bg-surface shadow-sm ring-1 ring-border" style={{ ...box, aspectRatio: String(aspect), padding: `${padPct}%` }}>
                    {problem ? <ProblemMark /> : it.preview ? <img src={it.preview} alt="" draggable={false} class="pointer-events-none min-h-0 min-w-0 flex-1 object-contain" /> : <Spinner />}
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="line-clamp-2 break-all text-xs font-medium sm:line-clamp-1 sm:text-sm" title={it.file.name}>
                    {it.file.name}
                  </p>
                  <p class="text-xs text-muted">
                    {it.pages ? `${it.pages} ${it.pages === 1 ? 'page' : 'pages'} · ` : ''}
                    {formatBytes(it.file.size)}
                    {it.preview ? '' : ' · adding…'}
                    {problem && <span class="ml-1.5 rounded-ctl bg-danger px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Can't read</span>}
                    {flashing && !problem && <span class="ml-1.5 rounded-ctl bg-success px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">{flashLabel}</span>}
                  </p>
                </div>
                <div class="flex shrink-0 gap-2">
                  {rotateButton(it)}
                  {removeButton(it, 'shrink-0', 'icon')}
                </div>
              </li>
            );
          }

          return (
            <li
              key={it.id}
              ref={(el) => {
                cards.current[i] = el;
              }}
              {...common}
              class={`relative select-none rounded-card p-2 [-webkit-touch-callout:none] ${cursor} ${surface}`}
            >
              {numberButton(i, number, 'absolute left-3 top-3 z-10')}
              {(problem || flashing) && (
                <span class={`pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 whitespace-nowrap rounded-ctl px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow ${problem ? 'bg-danger' : 'bg-success'}`}>
                  {problem ? "Can't read" : flashLabel}
                </span>
              )}
              {removeButton(it, "absolute right-3 top-3 z-10 shadow after:absolute after:-inset-2 after:content-['']", 'iconSm')}

              {/* The page: shape, margin and rotation follow the options panel */}
              <div class="flex bg-surface shadow-sm ring-1 ring-border" style={{ aspectRatio: String(aspect), padding: `${padPct}%` }}>
                {problem ? (
                  <ProblemMark />
                ) : it.preview ? (
                  <img src={it.preview} alt="" draggable={false} class="pointer-events-none min-h-0 min-w-0 flex-1 object-contain" />
                ) : (
                  <Spinner />
                )}
              </div>

              <div class="mt-2 flex items-center gap-1">
                <span class="min-w-0 flex-1 px-1 text-xs" title={it.file.name}>
                  <span class="block truncate">{it.file.name}</span>
                  {it.pages && <span class="block text-[11px] text-muted">{it.pages} {it.pages === 1 ? 'page' : 'pages'}</span>}
                </span>
                {rotateButton(it)}
              </div>
            </li>
          );
        })}
      </ul>

      {moving !== null && items[moving] && (
        <MoveDialog
          from={moving}
          total={items.length}
          name={items[moving].file.name}
          onMove={(to) => {
            onReorder(moving, to);
            setMoving(null);
          }}
          onClose={() => setMoving(null)}
        />
      )}
    </div>
  );
}
