import type { PrismaClient } from '@/generated/prisma/client';

import type { NuevaSesion, SesionesRepository } from '../domain/sesiones.repository';
import type { UsuarioSesion } from '../domain/usuario-sesion';

export class PrismaSesionesRepository implements SesionesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async crear(sesion: NuevaSesion): Promise<void> {
    await this.prisma.sesion.create({ data: sesion });
  }

  async buscarUsuarioVigente(tokenHash: string, ahora: Date): Promise<UsuarioSesion | null> {
    const sesion = await this.prisma.sesion.findUnique({
      where: { tokenHash },
      select: {
        expiraEn: true,
        usuario: { select: { id: true, nombre: true, email: true, rol: true, activo: true } },
      },
    });

    if (!sesion || sesion.expiraEn <= ahora || !sesion.usuario.activo) {
      return null;
    }

    const { id, nombre, email, rol } = sesion.usuario;
    return { id, nombre, email, rol };
  }

  async eliminar(tokenHash: string): Promise<void> {
    await this.prisma.sesion.deleteMany({ where: { tokenHash } });
  }
}
