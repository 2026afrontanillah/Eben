import type { UsuarioSesion } from './usuario-sesion';

export interface NuevaSesion {
  tokenHash: string;
  usuarioId: string;
  expiraEn: Date;
}

export interface SesionesRepository {
  crear(sesion: NuevaSesion): Promise<void>;
  buscarUsuarioVigente(tokenHash: string, ahora: Date): Promise<UsuarioSesion | null>;
  eliminar(tokenHash: string): Promise<void>;
}
