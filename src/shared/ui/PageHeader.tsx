import type { ReactNode } from 'react';
import { Link } from '../../client/router';

interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
}

export function PageHeader({ title, eyebrow, description, actions, backHref, backLabel }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {backHref ? (
          <Link
            href={backHref}
            className="mb-3 inline-flex min-h-11 items-center text-sm font-semibold text-ink-muted hover:text-ink"
          >
            ← {backLabel ?? 'Volver'}
          </Link>
        ) : null}
        {eyebrow ? (
          <p className="border-l-4 border-brand pl-2.5 text-xs font-extrabold tracking-[0.2em] text-ink uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{title}</h1>
        {description ? <div className="mt-2 text-ink-muted">{description}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
