import type { TransactionClient } from '@/server/db/transaction-client';

import { AsientosNoDisponiblesError, StockInsuficienteError } from '../domain/ventas.errors';

/**
 * El UPDATE condicional es atómico en PostgreSQL: si dos ventas compiten por el último cupo,
 * la segunda espera el bloqueo de la fila, re-evalúa la condición y no actualiza nada.
 */
export async function reservarCupos(tx: TransactionClient, zonaId: string, cantidad: number): Promise<void> {
  const { count } = await tx.zona.updateMany({
    where: { id: zonaId, habilitada: true, disponibles: { gte: cantidad } },
    data: { disponibles: { decrement: cantidad } },
  });
  if (count === 1) {
    return;
  }

  const zona = await tx.zona.findUniqueOrThrow({ where: { id: zonaId }, select: { nombre: true, disponibles: true } });
  throw new StockInsuficienteError(zona.disponibles, zona.nombre);
}

/** Marca las sillas como vendidas solo si todas seguían disponibles; devuelve el id de cada silla. */
export async function reservarAsientos(
  tx: TransactionClient,
  zonaId: string,
  mesa: number,
  sillas: readonly number[],
): Promise<Map<number, string>> {
  const reservados = await tx.asiento.updateManyAndReturn({
    where: { zonaId, mesa, silla: { in: [...sillas] }, estado: 'DISPONIBLE' },
    data: { estado: 'VENDIDO' },
    select: { id: true, silla: true },
  });

  if (reservados.length !== sillas.length) {
    const reservadas = new Set(reservados.map((asiento) => asiento.silla));
    throw new AsientosNoDisponiblesError(
      mesa,
      sillas.filter((silla) => !reservadas.has(silla)),
    );
  }

  return new Map(reservados.map((asiento) => [asiento.silla, asiento.id]));
}
