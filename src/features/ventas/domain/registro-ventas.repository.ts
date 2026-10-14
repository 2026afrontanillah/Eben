import type { DatosCliente, DatosPago, VentaRegistrada } from './venta';

export interface NuevaVenta {
  codigo: string;
  eventoId: string;
  zonaId: string;
  vendedorId: string;
  cliente: DatosCliente;
  pago: DatosPago;
  precioUnitarioCentavos: number;
  totalCentavos: number;
}

export interface NuevaVentaGeneral extends NuevaVenta {
  codigosEntrada: string[];
}

export interface NuevaEntradaNumerada {
  silla: number;
  codigo: string;
}

export interface NuevaVentaNumerada extends NuevaVenta {
  mesa: number;
  entradas: NuevaEntradaNumerada[];
}

/**
 * Las implementaciones deben reservar el stock y las sillas de forma atómica: si dos vendedores
 * compiten por el mismo cupo, solo uno puede confirmar la venta.
 */
export interface RegistroVentasRepository {
  registrarGeneral(venta: NuevaVentaGeneral): Promise<VentaRegistrada>;
  registrarNumerada(venta: NuevaVentaNumerada): Promise<VentaRegistrada>;
}
