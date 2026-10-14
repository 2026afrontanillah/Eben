import type { UsuarioSesion } from './usuario-sesion';

export interface CredencialesUsuario extends UsuarioSesion {
  passwordHash: string;
  activo: boolean;
}

export interface CredencialesRepository {
  buscarPorEmail(email: string): Promise<CredencialesUsuario | null>;
}
