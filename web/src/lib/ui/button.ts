/**
 * Single source of truth for button styling. Used by components/ui/Button.tsx
 * (islands), components/ui/Button.astro (static pages) and by elements that
 * must look like buttons but are not <button> (e.g. <label> wrapping a file input).
 * Colors come from tokens, corner radius from `rounded-ctl` (global.css).
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'cta' | 'icon' | 'iconSm';

const BASE =
  // slow fade back after release (duration-300) but instant on press (active:duration-75): a tap leaves a visible flash
  'inline-flex select-none items-center justify-center gap-2 rounded-ctl transition-[color,background-color,border-color,box-shadow,transform] duration-300 active:duration-75 disabled:pointer-events-none disabled:opacity-50';

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-brand font-semibold text-on-brand shadow-md shadow-black/20 hover:bg-brand-hover hover:shadow-lg active:scale-[0.98] active:bg-brand-active active:shadow-sm',
  secondary: 'border border-border bg-surface font-medium text-text shadow-sm shadow-black/10 hover:bg-surface-2 hover:shadow-md active:scale-[0.97] active:border-neutral active:bg-neutral active:text-on-neutral active:shadow-none',
  ghost: 'font-medium text-text hover:bg-surface-2 active:scale-[0.97] active:bg-border',
  link: 'font-medium text-link underline underline-offset-4 hover:text-brand-hover active:text-brand-active',
};

/** All sizes keep a touch target of 44px or more, except the tiny overlay icon button. */
const SIZE: Record<ButtonSize, string> = {
  // compact (looks ~32px tall, tap area stays 44px thanks to the invisible ::after)
  sm: "relative min-h-8 px-2.5 text-xs after:absolute after:inset-x-0 after:-inset-y-1.5 after:content-[''] sm:min-h-9 sm:px-3 sm:text-sm",
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-12 px-6 text-base',
  xl: 'min-h-16 px-8 text-xl',
  // main Convert button: compact on phones, larger from 640px
  cta: 'min-h-12 px-6 text-base sm:min-h-14 sm:px-8 sm:text-lg',
  // looks 32px but the invisible ::after makes the tap area 44px
  icon: "relative h-8 w-8 after:absolute after:-inset-1.5 after:content-['']",
  iconSm: 'h-7 w-7',
};

export interface ButtonStyle {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** stretch to the full width of the parent */
  full?: boolean;
}

export function buttonClass({ variant = 'primary', size = 'md', full = false }: ButtonStyle = {}): string {
  return [BASE, VARIANT[variant], variant === 'link' ? 'min-h-11 px-3 text-sm' : SIZE[size], full ? 'w-full' : '']
    .filter(Boolean)
    .join(' ');
}
