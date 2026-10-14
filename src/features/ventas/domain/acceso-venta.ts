import { tienePermiso } from '@/features/auth/domain/permisos';
import type { UsuarioSesion } from '@/features/auth/domain/usuario-sesion';

export function puedeVerVenta(usuario: UsuarioSesion, vendedorId: string): boolean {
  return usuario.id === vendedorId || tienePermiso(usuario.rol, 'VER_TODAS_LAS_VENTAS');
}

export function puedeListarVentas(usuario: UsuarioSesion): boolean {
  return tienePermiso(usuario.rol, 'VENDER') || tienePermiso(usuario.rol, 'VER_TODAS_LAS_VENTAS');
}
