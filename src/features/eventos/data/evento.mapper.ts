import type { Evento as EventoRecord } from '@/generated/prisma/client';

import type { Evento } from '../domain/evento';

export function toEvento(record: EventoRecord): Evento {
  return {
    id: record.id,
    slug: record.slug,
    nombre: record.nombre,
    lugar: record.lugar,
    fecha: record.fecha,
    plano: { columnas: record.planoColumnas, filas: record.planoFilas },
  };
}
