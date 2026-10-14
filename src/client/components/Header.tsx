import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { useRouter, Link } from '../router';
import { MarcaLogo } from '@/shared/brand/MarcaLogo';
import { Badge } from '@/shared/ui/Badge';

export function Header() {
  const { user, logout, hasPermiso } = useAuth();
  const { pathname, navigate } = useRouter();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [confirmarLogout, setConfirmarLogout] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);

  // Cerrar modal con tecla Escape
  useEffect(() => {
    if (!confirmarLogout) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmarLogout(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmarLogout]);

  if (!user) return null;

  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      await logout();
      navigate('/login');
    } finally {
      setLoadingLogout(false);
      setConfirmarLogout(false);
    }
  };

  const navItems = [];
  if (user.rol === 'CONTROL') {
    navItems.push({ href: '/control', label: 'Escáner en puerta' });
  } else {
    if (hasPermiso('VENDER')) {
      navItems.push({ href: '/', label: 'Mapa de zonas' });
      navItems.push({ href: '/ventas', label: 'Ventas' });
    }
    if (hasPermiso('VALIDAR_ENTRADAS')) {
      navItems.push({ href: '/control', label: 'Control de acceso' });
    }
    if (user.rol === 'ADMIN') {
      navItems.push({ href: '/admin/resumen', label: 'Resumen' });
      navItems.push({ href: '/admin/zonas', label: 'Zonas' });
      navItems.push({ href: '/admin/usuarios', label: 'Usuarios' });
    }
  }

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrador',
    VENDEDOR: 'Vendedor',
    RELACIONADOR: 'Relacionador',
    CONTROL: 'Personal de Puerta',
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href={user.rol === 'CONTROL' ? '/control' : '/'} className="flex items-center gap-2.5">
              <MarcaLogo className="size-8" />
              <span className="text-lg font-black tracking-wider text-ink uppercase">!EBEN</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex md:items-center md:gap-1">
              {navItems.map((item) => {
                const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                      active
                        ? 'bg-brand text-brand-ink'
                        : 'text-ink-muted hover:bg-surface-raised hover:text-ink'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex sm:flex-col sm:items-end">
              <span className="text-sm font-bold text-ink">{user.nombre}</span>
              <Badge tone="neutral" className="text-[10px]">
                {roleLabels[user.rol] || user.rol}
              </Badge>
            </div>

            <button
              type="button"
              onClick={() => setConfirmarLogout(true)}
              className="rounded-lg border border-line bg-surface-raised px-3 py-1.5 text-xs font-semibold text-ink-muted hover:border-line-strong hover:text-ink transition active:scale-[0.98]"
            >
              Salir
            </button>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="grid size-9 place-items-center rounded-lg border border-line bg-surface-raised text-ink md:hidden"
              aria-label="Abrir menú"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {menuAbierto && (
          <div className="border-t border-line bg-surface px-4 py-3 md:hidden">
            <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
              <span className="text-sm font-bold text-ink">{user.nombre}</span>
              <Badge tone="neutral" className="text-[10px]">
                {roleLabels[user.rol] || user.rol}
              </Badge>
            </div>
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuAbierto(false)}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      active ? 'bg-brand text-brand-ink' : 'text-ink-muted hover:bg-surface-raised hover:text-ink'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-3 border-t border-line pt-2">
              <button
                type="button"
                onClick={() => {
                  setMenuAbierto(false);
                  setConfirmarLogout(true);
                }}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition"
              >
                <span>Cerrar sesión</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* POPUP MODAL DE CONFIRMACIÓN DE CERRAR SESIÓN */}
      {confirmarLogout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setConfirmarLogout(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-line bg-surface-raised p-6 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-inner">
                <svg
                  viewBox="0 0 24 24"
                  className="size-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>

              <h2 className="text-xl font-black text-ink">¿Cerrar sesión?</h2>
              <p className="mt-2 text-sm text-ink-muted">
                ¿Estás seguro de que deseas salir de tu cuenta, <strong className="text-ink">{user.nombre}</strong>?
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmarLogout(false)}
                disabled={loadingLogout}
                className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink shadow-sm transition hover:bg-surface-strong hover:border-line-strong active:scale-[0.98] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loadingLogout}
                className="w-full rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-950/40 transition disabled:opacity-50"
              >
                {loadingLogout ? 'Saliendo…' : 'Sí, salir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
