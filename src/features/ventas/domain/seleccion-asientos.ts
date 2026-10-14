import type { DistribucionMesas } from '@/features/eventos/domain/zona';

import { MAX_ENTRADAS_POR_VENTA } from './reglas-venta';
import { SeleccionAsientosInvalidaError } from './ventas.errors';

export function normalizarSeleccion(
  distribucion: DistribucionMesas | null,
  mesa: number,
  sillas: readonly number[],
): number[] {
  if (!distribucion) {
    throw new SeleccionAsientosInvalidaError('la zona no tiene mesas configuradas');
  }
  if (!Number.isInteger(mesa) || mesa < 1 || mesa > distribucion.mesas) {
    throw new SeleccionAsientosInvalidaError('la mesa no existe');
  }

  const unicas = [...new Set(sillas)].sort((a, b) => a - b);
  if (unicas.length === 0) {
    throw new SeleccionAsientosInvalidaError('selecciona al menos una silla');
  }
  if (unicas.length !== sillas.length) {
    throw new SeleccionAsientosInvalidaError('hay sillas repetidas');
  }
  if (unicas.length > MAX_ENTRADAS_POR_VENTA) {
    throw new SeleccionAsientosInvalidaError(`máximo ${MAX_ENTRADAS_POR_VENTA} sillas por venta`);
  }
  if (unicas.some((silla) => !Number.isInteger(silla) || silla < 1 || silla > distribucion.sillasPorMesa)) {
    throw new SeleccionAsientosInvalidaError('una de las sillas no existe en la mesa');
  }

  return unicas;
}
