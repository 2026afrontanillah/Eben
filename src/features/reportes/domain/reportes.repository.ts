import type { ResumenMetodoPago, ResumenVendedor, ResumenZona } from './resumen-ventas';

export interface ReportesRepository {
  resumirPorZona(eventoId: string): Promise<ResumenZona[]>;
  resumirPorMetodoPago(eventoId: string): Promise<ResumenMetodoPago[]>;
  resumirPorVendedor(eventoId: string): Promise<ResumenVendedor[]>;
  contarIngresados(eventoId: string): Promise<number>;
}
