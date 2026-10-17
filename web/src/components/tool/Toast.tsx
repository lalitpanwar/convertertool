interface Props {
  /** adding = work in progress (spinner), done = finished (green check) */
  kind: 'adding' | 'done';
  text: string;
}

/**
 * Small floating message at the bottom of the screen (above the sticky Convert
 * bar on phones). Does not move the layout. Announced politely to screen readers.
 */
export default function Toast({ kind, text }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      class="pointer-events-none fixed bottom-24 left-1/2 z-40 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 rounded-card bg-text px-4 py-2.5 text-sm font-medium text-white shadow-xl lg:bottom-8"
    >
      {kind === 'adding' ? (
        <span class="block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
      ) : (
        <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
      )}
      <span class="truncate">{text}</span>
    </div>
  );
}
