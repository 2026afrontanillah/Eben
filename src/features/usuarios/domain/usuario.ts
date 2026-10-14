import type { Rol } from '@/features/auth/domain/rol';

export interface UsuarioListado {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  creadoEn: Date;
}
