import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink hover:bg-accent-hover',
  secondary:
    'border border-line-strong/50 bg-surface text-ink hover:border-line-strong hover:bg-sunken',
  ghost: 'text-ink-2 hover:bg-sunken hover:text-ink',
  danger: 'bg-danger text-surface hover:opacity-90',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 gap-1.5 px-3 text-sm',
  md: 'h-11 gap-2 px-4 text-[0.9375rem]',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra = ''): string {
  return [
    'inline-flex shrink-0 items-center justify-center rounded-control font-medium whitespace-nowrap',
    'transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-55',
    VARIANTS[variant],
    SIZES[size],
    extra,
  ].join(' ');
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
