import type { VentaDetalle, VentaResumen } from './venta';

export interface FiltroVentas {
  vendedorId?: string;
  busqueda?: string;
  limite: number;
}

export interface ConsultaVentasRepository {
  obtenerDetalle(ventaId: string): Promise<VentaDetalle | null>;
  listar(filtro: FiltroVentas): Promise<VentaResumen[]>;
}
