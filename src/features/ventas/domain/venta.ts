import type { EstadoEntrada, UbicacionEntrada } from '@/features/entradas/domain/entrada';

import type { MetodoPago } from './metodo-pago';

export type EstadoVenta = 'CONFIRMADA' | 'ANULADA';

export interface DatosCliente {
  nombre: string;
  celular: string;
  email: string | null;
}

export interface DatosPago {
  metodo: MetodoPago;
  referencia: string | null;
}

export interface VentaRegistrada {
  id: string;
  codigo: string;
}

export interface VentaResumen {
  id: string;
  codigo: string;
  creadaEn: Date;
  zonaNombre: string;
  cliente: DatosCliente;
  cantidad: number;
  totalCentavos: number;
  estado: EstadoVenta;
  vendedorNombre: string;
  metodoPago: MetodoPago | null;
}

export interface PagoRegistrado {
  metodo: MetodoPago;
  montoCentavos: number;
  referencia: string | null;
  registradoEn: Date;
  registradoPorNombre: string;
}

export interface EntradaDeVenta {
  id: string;
  codigo: string;
  estado: EstadoEntrada;
  ubicacion: UbicacionEntrada | null;
  usadaEn: Date | null;
}

export interface AnulacionVenta {
  fecha: Date;
  motivo: string;
  anuladaPorNombre: string;
}

export interface VentaDetalle {
  id: string;
  codigo: string;
  evento: { id: string; nombre: string };
  zona: { id: string; codigo: string; nombre: string };
  vendedor: { id: string; nombre: string };
  cliente: DatosCliente;
  cantidad: number;
  precioUnitarioCentavos: number;
  totalCentavos: number;
  estado: EstadoVenta;
  creadaEn: Date;
  anulacion: AnulacionVenta | null;
  pagos: PagoRegistrado[];
  entradas: EntradaDeVenta[];
}
