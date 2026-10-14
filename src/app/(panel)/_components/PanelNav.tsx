'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/shared/ui/cn';

import type { NavItem } from '../_lib/nav-items';

function estaActivo(href: string, pathname: string): boolean {
  if (href === '/') {
    return pathname === '/' || pathname.startsWith('/eventos');
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PanelNav({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Principal" className="-mx-1 overflow-x-auto">
      <ul className="flex gap-1 px-1">
        {items.map((item) => {
          const activo = estaActivo(item.href, pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={activo ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold whitespace-nowrap',
                  activo ? 'bg-brand text-brand-ink' : 'text-ink-muted hover:bg-surface-raised hover:text-ink',
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
