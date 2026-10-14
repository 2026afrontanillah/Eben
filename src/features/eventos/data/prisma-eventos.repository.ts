import type { PrismaClient } from '@/generated/prisma/client';

import type { Evento } from '../domain/evento';
import type { EventosRepository } from '../domain/eventos.repository';
import { toEvento } from './evento.mapper';

export class PrismaEventosRepository implements EventosRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async obtenerActivo(): Promise<Evento | null> {
    const evento = await this.prisma.evento.findFirst({
      where: { activo: true },
      orderBy: [{ fecha: 'asc' }, { creadoEn: 'asc' }],
    });
    return evento ? toEvento(evento) : null;
  }

  async obtenerPorId(eventoId: string): Promise<Evento | null> {
    const evento = await this.prisma.evento.findUnique({ where: { id: eventoId } });
    return evento ? toEvento(evento) : null;
  }
}
