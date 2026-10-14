import 'server-only';

import { redirect } from 'next/navigation';

import { PermisoDenegadoError, SesionRequeridaError } from '../domain/auth.errors';
import { tienePermiso, type Permiso } from '../domain/permisos';
import type { UsuarioSesion } from '../domain/usuario-sesion';
import { getUsuarioActual } from './current-user';

export async function requireUsuario(): Promise<UsuarioSesion> {
  const usuario = await getUsuarioActual();
  if (!usuario) {
    redirect('/login');
  }
  return usuario;
}

export async function requirePermiso(permiso: Permiso): Promise<UsuarioSesion> {
  const usuario = await requireUsuario();
  if (!tienePermiso(usuario.rol, permiso)) {
    redirect('/');
  }
  return usuario;
}

export async function authorizeAction(permiso: Permiso): Promise<UsuarioSesion> {
  const usuario = await getUsuarioActual();
  if (!usuario) {
    throw new SesionRequeridaError();
  }
  if (!tienePermiso(usuario.rol, permiso)) {
    throw new PermisoDenegadoError();
  }
  return usuario;
}
