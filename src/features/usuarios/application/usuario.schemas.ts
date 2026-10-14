import { z } from 'zod';

import { ROLES } from '@/features/auth/domain/rol';

export const crearUsuarioSchema = z.object({
  nombre: z.string().trim().min(3, 'Ingresa nombre y apellido.').max(100, 'Máximo 100 caracteres.'),
  email: z.string().trim().toLowerCase().pipe(z.email('Ingresa un email válido.')),
  rol: z.enum(ROLES, { error: 'Elige un rol.' }),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.').max(128, 'Máximo 128 caracteres.'),
});

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;

export const cambiarEstadoUsuarioSchema = z.object({
  usuarioId: z.uuid(),
  activo: z.enum(['true', 'false']).transform((valor) => valor === 'true'),
});
