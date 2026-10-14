import { describe, expect, it, vi } from 'vitest';

import { CredencialesInvalidasError } from '../domain/auth.errors';
import type { CredencialesRepository, CredencialesUsuario } from '../domain/credenciales.repository';
import type { PasswordHasher } from '../domain/password-hasher';
import type { NuevaSesion, SesionesRepository } from '../domain/sesiones.repository';
import { AuthService, DURACION_SESION_MS } from './auth.service';
import { hashSessionToken } from './session-token';

const AHORA = new Date('2026-10-13T20:00:00Z');

const usuarioActivo: CredencialesUsuario = {
  id: 'usuario-1',
  nombre: 'Ana',
  email: 'ana@rela.bo',
  rol: 'VENDEDOR',
  activo: true,
  passwordHash: 'hash:secreto',
};

function crearHasherFalso(): PasswordHasher {
  return {
    hash: vi.fn(async (password: string) => `hash:${password}`),
    verify: vi.fn(async (password: string, hash: string) => hash === `hash:${password}`),
  };
}

function crearEscenario(usuario: CredencialesUsuario | null) {
  const sesionesCreadas: NuevaSesion[] = [];
  const credenciales: CredencialesRepository = { buscarPorEmail: vi.fn(async () => usuario) };
  const sesiones: SesionesRepository = {
    crear: vi.fn(async (sesion: NuevaSesion) => {
      sesionesCreadas.push(sesion);
    }),
    buscarUsuarioVigente: vi.fn(async () => null),
    eliminar: vi.fn(async () => undefined),
  };
  const hasher = crearHasherFalso();
  const service = new AuthService(credenciales, sesiones, hasher, () => AHORA);
  return { service, credenciales, sesiones, hasher, sesionesCreadas };
}

describe('AuthService.iniciarSesion', () => {
  it('crea una sesión guardando solo el hash del token', async () => {
    const { service, sesionesCreadas, credenciales } = crearEscenario(usuarioActivo);

    const sesion = await service.iniciarSesion('  ANA@rela.bo ', 'secreto');

    expect(credenciales.buscarPorEmail).toHaveBeenCalledWith('ana@rela.bo');
    expect(sesionesCreadas).toEqual([
      { tokenHash: hashSessionToken(sesion.token), usuarioId: 'usuario-1', expiraEn: sesion.expiraEn },
    ]);
    expect(sesion.expiraEn.getTime()).toBe(AHORA.getTime() + DURACION_SESION_MS);
  });

  it('rechaza una contraseña incorrecta', async () => {
    const { service } = crearEscenario(usuarioActivo);
    await expect(service.iniciarSesion('ana@rela.bo', 'otra')).rejects.toBeInstanceOf(CredencialesInvalidasError);
  });

  it('rechaza un usuario desactivado aunque la contraseña sea correcta', async () => {
    const { service } = crearEscenario({ ...usuarioActivo, activo: false });
    await expect(service.iniciarSesion('ana@rela.bo', 'secreto')).rejects.toBeInstanceOf(CredencialesInvalidasError);
  });

  it('verifica contra un hash señuelo cuando el email no existe', async () => {
    const { service, hasher } = crearEscenario(null);

    await expect(service.iniciarSesion('nadie@rela.bo', 'clave')).rejects.toBeInstanceOf(CredencialesInvalidasError);
    expect(hasher.verify).toHaveBeenCalledTimes(1);
  });
});

describe('AuthService.obtenerUsuario', () => {
  it('busca la sesión por el hash del token y la fecha actual', async () => {
    const { service, sesiones } = crearEscenario(usuarioActivo);

    await service.obtenerUsuario('token-plano');

    expect(sesiones.buscarUsuarioVigente).toHaveBeenCalledWith(hashSessionToken('token-plano'), AHORA);
  });
});
