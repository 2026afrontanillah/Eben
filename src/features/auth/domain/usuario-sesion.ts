import type { Rol } from './rol';

export interface UsuarioSesion {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
}
