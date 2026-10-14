import type { Zona as ZonaRecord } from '@/generated/prisma/client';

import type { DistribucionMesas, Zona } from '../domain/zona';

function toDistribucion(record: ZonaRecord): DistribucionMesas | null {
  if (record.mesas === null || record.sillasPorMesa === null || record.mesasPorFila === null) {
    return null;
  }
  return { mesas: record.mesas, sillasPorMesa: record.sillasPorMesa, mesasPorFila: record.mesasPorFila };
}

export function toZona(record: ZonaRecord): Zona {
  return {
    id: record.id,
    eventoId: record.eventoId,
    codigo: record.codigo,
    nombre: record.nombre,
    tipo: record.tipo,
    precioCentavos: record.precioCentavos,
    capacidad: record.capacidad,
    disponibles: record.disponibles,
    habilitada: record.habilitada,
    areaPlano: record.areaPlano,
    color: record.color,
    orden: record.orden,
    distribucion: toDistribucion(record),
  };
}
