import type { Rol } from '@/features/auth/domain/rol';

import type { UsuarioListado } from './usuario';

export interface NuevoUsuario {
  nombre: string;
  email: string;
  passwordHash: string;
  rol: Rol;
}

export interface UsuariosRepository {
  listar(): Promise<UsuarioListado[]>;
  existeEmail(email: string): Promise<boolean>;
  crear(usuario: NuevoUsuario): Promise<void>;
  /** Al desactivar, también cierra las sesiones abiertas. Devuelve `false` si el usuario no existe. */
  cambiarEstado(usuarioId: string, activo: boolean): Promise<boolean>;
}
