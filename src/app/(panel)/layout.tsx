import type { ReactNode } from 'react';

import { requireUsuario } from '@/features/auth/server/guards';

import { PanelFooter } from './_components/PanelFooter';
import { PanelHeader } from './_components/PanelHeader';
import { construirNavItems } from './_lib/nav-items';

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const usuario = await requireUsuario();

  return (
    <div className="flex min-h-dvh flex-col">
      <PanelHeader usuario={usuario} navItems={construirNavItems(usuario)} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      <PanelFooter />
    </div>
  );
}
