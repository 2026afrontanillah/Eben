import type { ReactNode } from 'react';

import { cn } from './cn';

export type BadgeTone = 'neutral' | 'success' | 'danger' | 'warning' | 'inverse';

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: 'bg-surface-strong text-ink-muted',
  success: 'bg-success/15 text-success',
  danger: 'bg-danger/15 text-danger',
  warning: 'bg-warning/15 text-warning',
  inverse: 'bg-brand text-brand-ink',
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap',
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
