export type EstadoEntrada = 'VALIDA' | 'USADA' | 'ANULADA';

export const ETIQUETAS_ESTADO_ENTRADA: Record<EstadoEntrada, string> = {
  VALIDA: 'Válida',
  USADA: 'Usada',
  ANULADA: 'Anulada',
};

export interface UbicacionEntrada {
  mesa: number;
  silla: number;
}

export function describirUbicacion(ubicacion: UbicacionEntrada | null): string | null {
  return ubicacion ? `Mesa ${ubicacion.mesa} · Silla ${ubicacion.silla}` : null;
}
