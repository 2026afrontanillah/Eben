import { tienePermiso, type Permiso } from '@/features/auth/domain/permisos';
import type { UsuarioSesion } from '@/features/auth/domain/usuario-sesion';

export interface NavItem {
  href: string;
  label: string;
}

interface NavItemDefinicion {
  href: string;
  label: string | ((usuario: UsuarioSesion) => string);
  permisos: readonly Permiso[];
}

const NAV_ITEMS: readonly NavItemDefinicion[] = [
  { href: '/', label: 'Vender', permisos: ['VENDER'] },
  {
    href: '/ventas',
    label: (usuario) => (tienePermiso(usuario.rol, 'VER_TODAS_LAS_VENTAS') ? 'Ventas' : 'Mis ventas'),
    permisos: ['VENDER', 'VER_TODAS_LAS_VENTAS'],
  },
  { href: '/control', label: 'Control', permisos: ['VALIDAR_ENTRADAS'] },
  { href: '/admin/resumen', label: 'Resumen', permisos: ['VER_RESUMEN'] },
  { href: '/admin/zonas', label: 'Zonas', permisos: ['CONFIGURAR_ZONAS'] },
  { href: '/admin/usuarios', label: 'Usuarios', permisos: ['GESTIONAR_USUARIOS'] },
];

export function construirNavItems(usuario: UsuarioSesion): NavItem[] {
  return NAV_ITEMS.filter((item) => item.permisos.some((permiso) => tienePermiso(usuario.rol, permiso))).map(
    (item) => ({
      href: item.href,
      label: typeof item.label === 'function' ? item.label(usuario) : item.label,
    }),
  );
}
