export const MAX_ENTRADAS_POR_VENTA = 20;

export const LONGITUD_MINIMA_MOTIVO_ANULACION = 5;

export function calcularTotalCentavos(precioUnitarioCentavos: number, cantidad: number): number {
  return precioUnitarioCentavos * cantidad;
}

export function calcularCantidadMaxima(disponibles: number): number {
  return Math.min(MAX_ENTRADAS_POR_VENTA, disponibles);
}

export function esCantidadValida(cantidad: number): boolean {
  return Number.isInteger(cantidad) && cantidad >= 1 && cantidad <= MAX_ENTRADAS_POR_VENTA;
}
