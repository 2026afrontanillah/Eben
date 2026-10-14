import type { ReportesRepository } from '../domain/reportes.repository';
import { calcularTotales, type ResumenVentas } from '../domain/resumen-ventas';

export class ObtenerResumenVentasUseCase {
  constructor(private readonly reportes: ReportesRepository) {}

  async ejecutar(eventoId: string): Promise<ResumenVentas> {
    const [porZona, porMetodoPago, porVendedor, ingresados] = await Promise.all([
      this.reportes.resumirPorZona(eventoId),
      this.reportes.resumirPorMetodoPago(eventoId),
      this.reportes.resumirPorVendedor(eventoId),
      this.reportes.contarIngresados(eventoId),
    ]);

    return { totales: calcularTotales(porZona, ingresados), porZona, porMetodoPago, porVendedor };
  }
}
