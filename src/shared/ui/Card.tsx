import type { ReactNode } from 'react';

import { cn } from './cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  as?: 'section' | 'article' | 'div';
  'aria-label'?: string;
}

export function Card({ children, className, as: Component = 'section', ...rest }: CardProps) {
  return (
    <Component
      className={cn(
        'rounded-2xl panel p-5 shadow-2xl shadow-black/40 sm:p-6',
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}
