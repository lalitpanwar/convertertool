import OptionGroup from './OptionGroup';
import TileGroup from './TileGroup';
import CheckField from './CheckField';
import { LandscapeIcon, MarginIcon, PortraitIcon } from './tile-icons';
import type { Margin, Orientation, PageSize } from '@/lib/pdf/page-config';

/**
 * THE PDF page options. Every tool that creates PDF pages shows exactly these controls
 * (same names, same order, same four margin choices), so a user learns them once.
 *
 *   Page size      (A4, Letter and, for photos, Fit)
 *   Orientation
 *   Margin         (None, Small, Normal, Big)
 *   Page numbers   (only tools that pass `pageNumbers`)
 *
 * One setting per row on EVERY screen size (phone, tablet, desktop), in that order. Never mix two settings in a row.
 *
 * It returns the rows as a fragment: put it inside ToolWorkspace's `options` slot.
 */
interface Props {
  /** unique prefix for the radio group names when a page ever has two of these */
  idPrefix?: string;
  pageSize: PageSize;
  onPageSize: (v: PageSize) => void;
  /** offer "Fit" (page = the photo): image tools only */
  allowFit?: boolean;
  orientation: Orientation;
  onOrientation: (v: Orientation) => void;
  margin: Margin;
  onMargin: (v: Margin) => void;
  /** show the "Page numbers" checkbox (omit to hide it) */
  pageNumbers?: boolean;
  onPageNumbers?: (v: boolean) => void;
  disabled?: boolean;
}

export default function PdfPageOptions({
  idPrefix = 'pdf',
  pageSize,
  onPageSize,
  allowFit,
  orientation,
  onOrientation,
  margin,
  onMargin,
  pageNumbers,
  onPageNumbers,
  disabled,
}: Props) {
  const fit = pageSize === 'fit';
  return (
    <>
      {/* every setting is its own row on every screen size (phone, tablet, desktop) */}
      <OptionGroup
        legend="Page size"
        name={`${idPrefix}-size`}
        value={pageSize}
        onChange={onPageSize}
        disabled={disabled}
        options={[
          { value: 'a4', label: 'A4' },
          { value: 'letter', label: 'Letter' },
          ...(allowFit ? [{ value: 'fit' as const, label: 'Fit' }] : []),
        ]}
        hint={allowFit ? 'Fit: each page takes the shape of its photo.' : undefined}
      />
      <TileGroup
        legend="Orientation"
        name={`${idPrefix}-orientation`}
        value={orientation}
        onChange={onOrientation}
        disabled={disabled || fit}
        hint={fit ? 'Not used for Fit.' : undefined}
        options={[
          { value: 'portrait', label: 'Portrait', icon: <PortraitIcon /> },
          { value: 'landscape', label: 'Landscape', icon: <LandscapeIcon /> },
        ]}
      />

      <TileGroup
        legend="Margin"
        name={`${idPrefix}-margin`}
        value={margin}
        onChange={onMargin}
        disabled={disabled}
        options={[
          { value: 'none', label: 'None', icon: <MarginIcon inset={0} /> },
          { value: 'small', label: 'Small', icon: <MarginIcon inset={3} /> },
          { value: 'normal', label: 'Normal', icon: <MarginIcon inset={5} /> },
          { value: 'big', label: 'Big', icon: <MarginIcon inset={8} /> },
        ]}
      />

      {onPageNumbers && pageNumbers !== undefined && (
        <CheckField
          id={`${idPrefix}-page-numbers`}
          label="Page numbers"
          hint="Shows 1 / 3 at the bottom of each page"
          checked={pageNumbers}
          onChange={onPageNumbers}
          disabled={disabled}
        />
      )}
    </>
  );
}
