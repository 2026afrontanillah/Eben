import Link from 'next/link';

import { ETIQUETAS_ROL } from '@/features/auth/domain/rol';
import type { UsuarioSesion } from '@/features/auth/domain/usuario-sesion';
import { LogoutButton } from '@/features/auth/presentation/components/LogoutButton';
import { MarcaWordmark } from '@/shared/brand/MarcaWordmark';

import type { NavItem } from '../_lib/nav-items';
import { PanelNav } from './PanelNav';

interface PanelHeaderProps {
  usuario: UsuarioSesion;
  navItems: readonly NavItem[];
}

export function PanelHeader({ usuario, navItems }: PanelHeaderProps) {
  return (
    <header className="border-b border-line bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" aria-label="Inicio" className="shrink-0">
            <MarcaWordmark priority className="h-10 w-auto" />
          </Link>
          <div className="flex items-center gap-2 lg:hidden">
            <span className="text-right text-xs leading-tight text-ink-muted">
              <span className="block font-bold text-ink">{usuario.nombre}</span>
              {ETIQUETAS_ROL[usuario.rol]}
            </span>
            <LogoutButton />
          </div>
        </div>
        <PanelNav items={navItems} />
        <div className="hidden items-center gap-3 lg:flex">
          <span className="text-right text-xs leading-tight text-ink-muted">
            <span className="block font-bold text-ink">{usuario.nombre}</span>
            {ETIQUETAS_ROL[usuario.rol]}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
