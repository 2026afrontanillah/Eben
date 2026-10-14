import type { Rol } from './rol';

export const PERMISOS = [
  'VENDER',
  'VER_TODAS_LAS_VENTAS',
  'ANULAR_VENTAS',
  'VALIDAR_ENTRADAS',
  'VER_RESUMEN',
  'CONFIGURAR_ZONAS',
  'GESTIONAR_USUARIOS',
] as const;

export type Permiso = (typeof PERMISOS)[number];

const PERMISOS_POR_ROL: Record<Rol, readonly Permiso[]> = {
  ADMIN: PERMISOS,
  VENDEDOR: ['VENDER'],
  RELACIONADOR: ['VENDER'],
  CONTROL: ['VALIDAR_ENTRADAS'],
};

export function tienePermiso(rol: Rol, permiso: Permiso): boolean {
  return PERMISOS_POR_ROL[rol].includes(permiso);
}
