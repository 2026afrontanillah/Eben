import type { ButtonHTMLAttributes } from 'react';

import { buttonClassName, type ButtonStyleOptions } from './button-styles';

interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'>,
    ButtonStyleOptions {
  loading?: boolean;
}

export function Button({
  variant,
  size,
  fullWidth,
  className,
  loading = false,
  disabled,
  type = 'button',
  children,
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName({ variant, size, fullWidth, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
