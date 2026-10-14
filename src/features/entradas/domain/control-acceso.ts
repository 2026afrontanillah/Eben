import type { EstadoEntrada, UbicacionEntrada } from './entrada';

export interface EntradaControl {
  id: string;
  codigo: string;
  estado: EstadoEntrada;
  eventoNombre: string;
  zonaNombre: string;
  ubicacion: UbicacionEntrada | null;
  clienteNombre: string;
  usadaEn: Date | null;
}

export type ResultadoValidacion =
  | { tipo: 'ADMITIDA'; entrada: EntradaControl }
  | { tipo: 'YA_USADA'; entrada: EntradaControl }
  | { tipo: 'ANULADA'; entrada: EntradaControl }
  | { tipo: 'QR_INVALIDO' }
  | { tipo: 'NO_ENCONTRADA' };
