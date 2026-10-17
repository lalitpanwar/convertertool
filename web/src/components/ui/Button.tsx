import type { ComponentChildren } from 'preact';
import { buttonClass, type ButtonStyle } from '@/lib/ui/button';

interface Props extends ButtonStyle {
  /** renders an <a> when set */
  href?: string;
  download?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: (e: MouseEvent) => void;
  /** extra classes (spacing/positioning only, not colors) */
  class?: string;
  'aria-label'?: string;
  children: ComponentChildren;
}

/** The one button for Preact islands. For static .astro pages use Button.astro. */
export default function Button({ variant, size, full, href, download, type = 'button', disabled, onClick, class: extra, children, ...rest }: Props) {
  const cls = `${buttonClass({ variant, size, full })}${extra ? ` ${extra}` : ''}`;
  if (href) {
    return (
      <a href={href} download={download} class={cls} onClick={onClick} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} disabled={disabled} onClick={onClick} class={cls} {...rest}>
      {children}
    </button>
  );
}
