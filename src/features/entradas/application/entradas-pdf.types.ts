import type { UbicacionEntrada } from '../domain/entrada';

export interface EntradaPdf {
  codigo: string;
  qrToken: string;
  ubicacion: UbicacionEntrada | null;
}

export interface EntradasPdfDocumento {
  eventoNombre: string;
  zonaNombre: string;
  clienteNombre: string;
  precioUnitarioCentavos: number;
  metodoPagoEtiqueta: string;
  entradas: EntradaPdf[];
}
