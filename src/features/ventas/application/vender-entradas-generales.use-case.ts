import type { ZonasRepository } from '@/features/eventos/domain/zonas.repository';

import { crearCodigoEntradaGeneral, crearCodigoVenta } from '../domain/codigos-venta';
import { calcularTotalCentavos, esCantidadValida, MAX_ENTRADAS_POR_VENTA } from '../domain/reglas-venta';
import type { RegistroVentasRepository } from '../domain/registro-ventas.repository';
import type { DatosCliente, DatosPago, VentaRegistrada } from '../domain/venta';
import { CantidadInvalidaError, StockInsuficienteError } from '../domain/ventas.errors';
import { asegurarZonaVendible } from '../domain/zona-vendible';

export interface VentaGeneralSolicitud {
  eventoId: string;
  zonaId: string;
  cantidad: number;
  cliente: DatosCliente;
  pago: DatosPago;
  vendedorId: string;
}

export class VenderEntradasGeneralesUseCase {
  constructor(
    private readonly zonas: ZonasRepository,
    private readonly registro: RegistroVentasRepository,
    private readonly generarSufijo: () => string,
  ) {}

  async ejecutar(solicitud: VentaGeneralSolicitud): Promise<VentaRegistrada> {
    const zona = asegurarZonaVendible(await this.zonas.obtenerPorId(solicitud.zonaId), solicitud.eventoId, 'GENERAL');

    if (!esCantidadValida(solicitud.cantidad)) {
      throw new CantidadInvalidaError(MAX_ENTRADAS_POR_VENTA);
    }
    if (solicitud.cantidad > zona.disponibles) {
      throw new StockInsuficienteError(zona.disponibles, zona.nombre);
    }

    const sufijo = this.generarSufijo();
    return this.registro.registrarGeneral({
      codigo: crearCodigoVenta(sufijo),
      eventoId: solicitud.eventoId,
      zonaId: zona.id,
      vendedorId: solicitud.vendedorId,
      cliente: solicitud.cliente,
      pago: solicitud.pago,
      precioUnitarioCentavos: zona.precioCentavos,
      totalCentavos: calcularTotalCentavos(zona.precioCentavos, solicitud.cantidad),
      codigosEntrada: Array.from({ length: solicitud.cantidad }, (_, indice) =>
        crearCodigoEntradaGeneral(zona.codigo, sufijo, indice + 1),
      ),
    });
  }
}
