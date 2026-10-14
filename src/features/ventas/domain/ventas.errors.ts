import { DomainError } from '@/shared/errors/domain-error';

export class ZonaNoVendibleError extends DomainError {
  constructor(zonaNombre: string, motivo: string) {
    super(`No se puede vender en ${zonaNombre}: ${motivo}.`);
  }
}

export class CantidadInvalidaError extends DomainError {
  constructor(maximo: number) {
    super(`La cantidad debe estar entre 1 y ${maximo} entradas por venta.`);
  }
}

export class StockInsuficienteError extends DomainError {
  constructor(
    readonly disponibles: number,
    zonaNombre: string,
  ) {
    super(
      disponibles === 0
        ? `${zonaNombre} está agotada.`
        : `Solo quedan ${disponibles} entradas en ${zonaNombre}.`,
    );
  }
}

export class SeleccionAsientosInvalidaError extends DomainError {
  constructor(motivo: string) {
    super(`Selección de asientos inválida: ${motivo}.`);
  }
}

export class AsientosNoDisponiblesError extends DomainError {
  constructor(
    readonly mesa: number,
    readonly sillas: readonly number[],
  ) {
    super(
      sillas.length === 1
        ? `La silla ${sillas[0]} de la mesa ${mesa} ya fue vendida.`
        : `Las sillas ${sillas.join(', ')} de la mesa ${mesa} ya fueron vendidas.`,
    );
  }
}

export class VentaNoEncontradaError extends DomainError {
  constructor() {
    super('La venta no existe o no tienes acceso a ella.');
  }
}

export class VentaNoAnulableError extends DomainError {
  constructor(motivo: string) {
    super(`No se puede anular la venta: ${motivo}.`);
  }
}

export class VentaAnuladaError extends DomainError {
  constructor() {
    super('La venta está anulada; sus entradas ya no son válidas.');
  }
}

export class EntradaDeVentaNoEncontradaError extends DomainError {
  constructor() {
    super('La entrada no pertenece a esta venta.');
  }
}
