import type { PrismaClient } from '@/generated/prisma/client';

import type { CredencialesRepository, CredencialesUsuario } from '../domain/credenciales.repository';

export class PrismaCredencialesRepository implements CredencialesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  buscarPorEmail(email: string): Promise<CredencialesUsuario | null> {
    return this.prisma.usuario.findUnique({
      where: { email },
      select: { id: true, nombre: true, email: true, rol: true, activo: true, passwordHash: true },
    });
  }
}
