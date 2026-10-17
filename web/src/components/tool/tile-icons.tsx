/** Small SVG icons for TileGroup options. Stroke = currentColor so they follow tile state. */

const base = { fill: 'none', stroke: 'currentColor', 'stroke-width': 2.2, 'stroke-linejoin': 'round' } as const;

export const PortraitIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" {...base}>
    <rect x="9" y="4" width="14" height="24" rx="2" />
  </svg>
);

export const LandscapeIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" {...base}>
    <rect x="4" y="9" width="24" height="14" rx="2" />
  </svg>
);

/** Page with the picture inside; `inset` = space around the picture (0 none, 4 small, 8 big). */
export const MarginIcon = ({ inset }: { inset: number }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" {...base}>
    <rect x="2" y="2" width="28" height="28" rx="2" stroke-dasharray={inset ? '3 3' : undefined} />
    <rect x={2 + inset} y={2 + inset} width={28 - inset * 2} height={28 - inset * 2} rx="1" fill="currentColor" stroke="none" opacity="0.85" />
  </svg>
);

export const RotateIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke-linecap="round">
    <path d="M20 12a8 8 0 1 1-2.5-5.8" />
    <path d="M20 4v5h-5" />
  </svg>
);

export const GridIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
  </svg>
);

export const ListIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke-linecap="round">
    <path d="M8 6h13M8 12h13M8 18h13" />
    <circle cx="3.5" cy="6" r="1" fill="currentColor" />
    <circle cx="3.5" cy="12" r="1" fill="currentColor" />
    <circle cx="3.5" cy="18" r="1" fill="currentColor" />
  </svg>
);

export const AlignLeftIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" {...base} stroke-linecap="round">
    <path d="M6 8h20M6 14h13M6 20h20M6 26h13" />
  </svg>
);

export const AlignJustifyIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" {...base} stroke-linecap="round">
    <path d="M6 8h20M6 14h20M6 20h20M6 26h14" />
  </svg>
);

export const PencilIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke-linecap="round">
    <path d="M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19l-4 1z" />
  </svg>
);

export const EyeIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke-linecap="round">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/** Small icons for the settings strip (16px, follow the text color). */
export const FontSizeIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke-linecap="round">
    <path d="M3 19 8.5 5 14 19M5.2 14h6.6M18 7v10M16 9l2-2 2 2M16 15l2 2 2-2" />
  </svg>
);

export const LineSpacingIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke-linecap="round">
    <path d="M10 6h11M10 12h11M10 18h11M4 6v12M2 8l2-2 2 2M2 16l2 2 2-2" />
  </svg>
);

export const MarkdownIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke-linecap="round">
    <path d="M9 4 7 20M17 4l-2 16M4 9h17M3 15h17" />
  </svg>
);

export const QualityIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke-linecap="round">
    <path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 16.7 6.7 19.6l1.1-6L3.4 9.4l6-.8z" />
  </svg>
);

/** "Aa" as an icon for the font group */
export const FontTextIcon = () => <span class="text-xs font-bold leading-none">Aa</span>;

export const ArrowCircleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" {...base}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12h8M13 8l4 4-4 4" stroke-linecap="round" />
  </svg>
);

const line = { fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' } as const;

export const ListBulletIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...line} aria-hidden="true">
    <path d="M9 6h11M9 12h11M9 18h11" />
    <circle cx="4.5" cy="6" r="1" fill="currentColor" />
    <circle cx="4.5" cy="12" r="1" fill="currentColor" />
    <circle cx="4.5" cy="18" r="1" fill="currentColor" />
  </svg>
);

export const ListNumberIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...line} aria-hidden="true">
    <path d="M11 6h9M11 12h9M11 18h9" />
    <path d="M3.5 5l1.5-1v5M3.5 14.5h3l-3 3.5h3" stroke-width="1.6" />
  </svg>
);

/** which = left | center | right | justify */
export const AlignIcon = ({ which, size = 16 }: { which: 'left' | 'center' | 'right' | 'justify'; size?: number }) => {
  const rows: Record<string, number[][]> = {
    left: [[4, 20], [4, 14], [4, 20], [4, 14]],
    center: [[4, 20], [7, 17], [4, 20], [7, 17]],
    right: [[4, 20], [10, 20], [4, 20], [10, 20]],
    justify: [[4, 20], [4, 20], [4, 20], [4, 20]],
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...line} aria-hidden="true">
      {rows[which].map(([a, b], i) => (
        <path key={i} d={`M${a} ${5 + i * 4.7}H${b}`} />
      ))}
    </svg>
  );
};

export const ClearFormatIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...line} aria-hidden="true">
    <path d="M5 5h14M12 5v9M9 19h6" />
    <path d="M4 20L20 12" />
  </svg>
);
