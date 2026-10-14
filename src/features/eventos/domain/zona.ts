export type TipoZona = 'GENERAL' | 'NUMERADA';

export interface DistribucionMesas {
  mesas: number;
  sillasPorMesa: number;
  mesasPorFila: number;
}

export interface Zona {
  id: string;
  eventoId: string;
  codigo: string;
  nombre: string;
  tipo: TipoZona;
  precioCentavos: number | null;
  capacidad: number;
  disponibles: number;
  habilitada: boolean;
  areaPlano: string;
  color: string;
  orden: number;
  distribucion: DistribucionMesas | null;
}

export type EstadoZona = 'A_LA_VENTA' | 'AGOTADA' | 'SIN_PRECIO' | 'NO_HABILITADA';

export function obtenerEstadoZona(zona: Zona): EstadoZona {
  if (!zona.habilitada) {
    return 'NO_HABILITADA';
  }
  if (zona.precioCentavos === null) {
    return 'SIN_PRECIO';
  }
  if (zona.disponibles === 0) {
    return 'AGOTADA';
  }
  return 'A_LA_VENTA';
}

export function calcularVendidas(zona: Zona): number {
  return zona.capacidad - zona.disponibles;
}

export function calcularPorcentajeDisponible(zona: Zona): number {
  return zona.capacidad === 0 ? 0 : (zona.disponibles / zona.capacidad) * 100;
}
