import { ZonaNoEncontradaError } from '@/features/eventos/domain/eventos.errors';
import type { TipoZona, Zona } from '@/features/eventos/domain/zona';

import { ZonaNoVendibleError } from './ventas.errors';

export interface ZonaVendible extends Zona {
  precioCentavos: number;
}

export function asegurarZonaVendible(zona: Zona | null, eventoId: string, tipoEsperado: TipoZona): ZonaVendible {
  if (!zona || zona.eventoId !== eventoId) {
    throw new ZonaNoEncontradaError();
  }
  if (zona.tipo !== tipoEsperado) {
    throw new ZonaNoVendibleError(zona.nombre, 'el tipo de venta no corresponde a esta zona');
  }
  if (!zona.habilitada) {
    throw new ZonaNoVendibleError(zona.nombre, 'la zona no está habilitada');
  }
  if (zona.precioCentavos === null) {
    throw new ZonaNoVendibleError(zona.nombre, 'todavía no tiene precio configurado');
  }
  return { ...zona, precioCentavos: zona.precioCentavos };
}
