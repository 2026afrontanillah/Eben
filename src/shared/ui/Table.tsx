import type { ReactNode } from 'react';

import { cn } from './cn';

interface TableProps {
  caption: string;
  children: ReactNode;
}

export function Table({ caption, children }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl panel">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="px-4 pt-4 pb-2 text-left text-base font-extrabold text-ink">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

interface CellProps {
  children: ReactNode;
  align?: 'left' | 'right';
  hideOnMobile?: boolean;
}

export function Th({ children, align = 'left', hideOnMobile = false }: CellProps) {
  return (
    <th
      scope="col"
      className={cn(
        'border-b border-line px-3 py-2 text-[11px] font-bold tracking-wide text-ink-subtle uppercase sm:px-4 sm:text-xs',
        align === 'right' && 'text-right',
        hideOnMobile && 'hidden sm:table-cell',
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, align = 'left', hideOnMobile = false }: CellProps) {
  return (
    <td
      className={cn(
        'border-b border-line px-3 py-3 text-ink sm:px-4',
        align === 'right' && 'text-right tabular-nums',
        hideOnMobile && 'hidden sm:table-cell',
      )}
    >
      {children}
    </td>
  );
}
