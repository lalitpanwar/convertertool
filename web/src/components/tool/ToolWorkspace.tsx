import type { ComponentChildren } from 'preact';

/**
 * ONE layout for every tool that has a work area plus PDF options. Do not repeat this in tools.
 *
 *  - main      the work area (files, thumbnails, editor). EXTRA settings (font, size, quality...) live
 *              INSIDE it, as a SettingsStrip right on top of the editor / page grid
 *  - options   settings that belong to the PDF page (size, orientation, margin, page numbers).
 *              Always use <PdfPageOptions /> so they are identical in every tool
 *  - action    the Convert button (sticky at the bottom of the screen on phones)
 *
 *  Phone  (<640px):   main, PDF options, action                 (one column)
 *  Tablet (640-1023): PDF options (centered card, one setting per row), main (full width), action
 *  Desktop (1024+):   main on the left; sticky right panel with PDF options + action
 *                     (the panel scrolls inside itself when taller than the screen; the action stays pinned at its bottom)
 *
 * The aside is `display: contents` below 1024px, so its children can be ordered freely around `main`;
 * from 1024px it is a real card.
 */
interface Props {
  main: ComponentChildren;
  options?: ComponentChildren;
  optionsTitle?: string;
  action: ComponentChildren;
  /** dialogs and toasts (rendered after the layout, they float above it) */
  overlays?: ComponentChildren;
  onDragOver?: (e: DragEvent) => void;
  onDrop?: (e: DragEvent) => void;
}

const TITLE = 'border-b border-border pb-2 text-center text-base font-bold sm:text-lg';

export default function ToolWorkspace({ main, options, optionsTitle, action, overlays, onDragOver, onDrop }: Props) {
  return (
    <div class="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6" onDragOver={onDragOver} onDrop={onDrop}>
      <div class="order-1 grid min-w-0 gap-4 sm:order-2 sm:col-span-2 lg:order-1 lg:col-span-1 lg:col-start-1 lg:row-start-1">{main}</div>

      <aside class="contents lg:order-2 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-20 lg:grid lg:max-h-[calc(100vh-6rem)] lg:gap-4 lg:overflow-y-auto lg:rounded-card lg:border lg:border-border lg:bg-surface lg:p-5">
        {options && (
          // a card below the work area on phones; a wide two-column card above it on tablets; part of the panel on desktop
          <section
            class="order-2 grid content-start gap-3 rounded-card border border-border bg-surface p-3 sm:order-1 sm:col-span-2 sm:w-full sm:max-w-xl sm:justify-self-center sm:gap-4 sm:p-4 lg:col-span-1 lg:max-w-none lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0"
            aria-label={optionsTitle}
          >
            {optionsTitle && <h2 class={TITLE}>{optionsTitle}</h2>}
            {options}
          </section>
        )}

        <div
          class={`sticky bottom-3 z-10 order-3 -mx-2 rounded-card bg-surface/90 p-2 backdrop-blur sm:col-span-2 lg:-bottom-5 lg:col-span-1 lg:-mx-5 lg:-mb-5 lg:rounded-none lg:bg-surface lg:px-5 lg:pb-5 lg:backdrop-blur-none ${
            options ? 'lg:border-t lg:border-border lg:pt-3' : 'lg:pt-0'
          }`}
        >
          {action}
        </div>
      </aside>

      {overlays}
    </div>
  );
}
