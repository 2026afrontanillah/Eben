import 'server-only';

import { cache } from 'react';

import { getContainer } from '@/server/container';

import type { UsuarioSesion } from '../domain/usuario-sesion';
import { readSessionCookie } from './session-cookie';

export const getUsuarioActual = cache(async (): Promise<UsuarioSesion | null> => {
  const token = await readSessionCookie();
  if (!token) {
    return null;
  }
  return getContainer().authService.obtenerUsuario(token);
});
