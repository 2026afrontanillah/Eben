import { cn } from './cn';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

const BASE_CLASS =
  'inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-colors ' +
  'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-brand-ink hover:bg-brand/85',
  secondary: 'border border-line-strong bg-surface-raised text-ink hover:bg-surface-strong',
  danger: 'bg-red-600 text-white hover:bg-red-500',
  ghost: 'text-ink-muted hover:bg-surface-raised hover:text-ink',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-base',
};

export function buttonClassName({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: ButtonStyleOptions = {}): string {
  return cn(BASE_CLASS, VARIANT_CLASS[variant], SIZE_CLASS[size], fullWidth && 'w-full', className);
}
