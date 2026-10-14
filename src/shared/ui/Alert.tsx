import type { ReactNode } from 'react';

import { cn } from './cn';

type AlertTone = 'error' | 'success' | 'warning' | 'info';

const TONE_CLASS: Record<AlertTone, string> = {
  error: 'border-danger/40 bg-danger/10 text-red-200',
  success: 'border-success/40 bg-success/10 text-green-200',
  warning: 'border-warning/40 bg-warning/10 text-amber-100',
  info: 'border-line bg-surface-raised text-ink',
};

interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
  className?: string;
}

export function Alert({ tone = 'info', title, children, className }: AlertProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('rounded-xl border px-4 py-3 text-sm', TONE_CLASS[tone], className)}
    >
      {title ? <p className="font-bold">{title}</p> : null}
      {children ? <div className={cn(title && 'mt-1')}>{children}</div> : null}
    </div>
  );
}
