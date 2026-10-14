import { CredencialesInvalidasError } from '../domain/auth.errors';
import type { CredencialesRepository } from '../domain/credenciales.repository';
import { normalizarEmail } from '../domain/email';
import type { PasswordHasher } from '../domain/password-hasher';
import type { SesionesRepository } from '../domain/sesiones.repository';
import type { UsuarioSesion } from '../domain/usuario-sesion';
import { createSessionToken, hashSessionToken } from './session-token';

export const DURACION_SESION_MS = 12 * 60 * 60 * 1000;

const CONTRASENA_SENUELO = 'rela-contrasena-senuelo';

export interface SesionIniciada {
  token: string;
  expiraEn: Date;
}

export class AuthService {
  private hashSenuelo: Promise<string> | undefined;

  constructor(
    private readonly credenciales: CredencialesRepository,
    private readonly sesiones: SesionesRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly ahora: () => Date = () => new Date(),
  ) {}

  async iniciarSesion(email: string, password: string): Promise<SesionIniciada> {
    const usuario = await this.credenciales.buscarPorEmail(normalizarEmail(email));
    // Se verifica contra un hash señuelo cuando el email no existe para que el tiempo de respuesta
    // no revele qué cuentas están registradas.
    const hashAComparar = usuario?.passwordHash ?? (await this.obtenerHashSenuelo());
    const passwordValida = await this.passwordHasher.verify(password, hashAComparar);

    if (!usuario || !usuario.activo || !passwordValida) {
      throw new CredencialesInvalidasError();
    }

    const { token, tokenHash } = createSessionToken();
    const expiraEn = new Date(this.ahora().getTime() + DURACION_SESION_MS);
    await this.sesiones.crear({ tokenHash, usuarioId: usuario.id, expiraEn });

    return { token, expiraEn };
  }

  obtenerUsuario(token: string): Promise<UsuarioSesion | null> {
    return this.sesiones.buscarUsuarioVigente(hashSessionToken(token), this.ahora());
  }

  cerrarSesion(token: string): Promise<void> {
    return this.sesiones.eliminar(hashSessionToken(token));
  }

  private obtenerHashSenuelo(): Promise<string> {
    this.hashSenuelo ??= this.passwordHasher.hash(CONTRASENA_SENUELO);
    return this.hashSenuelo;
  }
}
