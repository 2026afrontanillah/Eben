import type { PrismaClient } from '@/generated/prisma/client';

import type { Zona } from '../domain/zona';
import type { ConfiguracionZona, ZonasRepository } from '../domain/zonas.repository';
import { toZona } from './zona.mapper';

export class PrismaZonasRepository implements ZonasRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listarPorEvento(eventoId: string): Promise<Zona[]> {
    const zonas = await this.prisma.zona.findMany({ where: { eventoId }, orderBy: { orden: 'asc' } });
    return zonas.map(toZona);
  }

  async obtenerPorId(zonaId: string): Promise<Zona | null> {
    const zona = await this.prisma.zona.findUnique({ where: { id: zonaId } });
    return zona ? toZona(zona) : null;
  }

  async actualizarConfiguracion(zonaId: string, configuracion: ConfiguracionZona): Promise<void> {
    await this.prisma.zona.update({ where: { id: zonaId }, data: configuracion });
  }
}
