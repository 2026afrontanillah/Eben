import { Prisma, type PrismaClient } from '@/generated/prisma/client';

import type { UsuarioListado } from '../domain/usuario';
import { EmailEnUsoError } from '../domain/usuarios.errors';
import type { NuevoUsuario, UsuariosRepository } from '../domain/usuarios.repository';

const VIOLACION_UNICIDAD = 'P2002';

export class PrismaUsuariosRepository implements UsuariosRepository {
  constructor(private readonly prisma: PrismaClient) {}

  listar(): Promise<UsuarioListado[]> {
    return this.prisma.usuario.findMany({
      orderBy: [{ activo: 'desc' }, { nombre: 'asc' }],
      select: { id: true, nombre: true, email: true, rol: true, activo: true, creadoEn: true },
    });
  }

  async existeEmail(email: string): Promise<boolean> {
    const usuario = await this.prisma.usuario.findUnique({ where: { email }, select: { id: true } });
    return usuario !== null;
  }

  async crear(usuario: NuevoUsuario): Promise<void> {
    try {
      await this.prisma.usuario.create({ data: usuario });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === VIOLACION_UNICIDAD) {
        throw new EmailEnUsoError();
      }
      throw error;
    }
  }

  cambiarEstado(usuarioId: string, activo: boolean): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.usuario.updateMany({ where: { id: usuarioId }, data: { activo } });
      if (count === 1 && !activo) {
        await tx.sesion.deleteMany({ where: { usuarioId } });
      }
      return count === 1;
    });
  }
}
