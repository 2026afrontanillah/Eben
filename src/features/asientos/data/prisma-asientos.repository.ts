import type { PrismaClient } from '@/generated/prisma/client';

import type { AsientosRepository } from '../domain/asientos.repository';
import type { EstadoAsiento } from '../domain/mesa';

export class PrismaAsientosRepository implements AsientosRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listarPorZona(zonaId: string): Promise<EstadoAsiento[]> {
    const asientos = await this.prisma.asiento.findMany({
      where: { zonaId },
      select: { mesa: true, silla: true, estado: true },
    });
    return asientos.map(({ mesa, silla, estado }) => ({ mesa, silla, vendido: estado === 'VENDIDO' }));
  }
}
