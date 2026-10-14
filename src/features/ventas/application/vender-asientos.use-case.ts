import type { ZonasRepository } from '@/features/eventos/domain/zonas.repository';

import { crearCodigoEntradaNumerada, crearCodigoVenta } from '../domain/codigos-venta';
import { calcularTotalCentavos } from '../domain/reglas-venta';
import type { RegistroVentasRepository } from '../domain/registro-ventas.repository';
import { normalizarSeleccion } from '../domain/seleccion-asientos';
import type { DatosCliente, DatosPago, VentaRegistrada } from '../domain/venta';
import { asegurarZonaVendible } from '../domain/zona-vendible';

export interface VentaAsientosSolicitud {
  eventoId: string;
  zonaId: string;
  mesa: number;
  sillas: readonly number[];
  cliente: DatosCliente;
  pago: DatosPago;
  vendedorId: string;
}

export class VenderAsientosUseCase {
  constructor(
    private readonly zonas: ZonasRepository,
    private readonly registro: RegistroVentasRepository,
    private readonly generarSufijo: () => string,
  ) {}

  async ejecutar(solicitud: VentaAsientosSolicitud): Promise<VentaRegistrada> {
    const zona = asegurarZonaVendible(await this.zonas.obtenerPorId(solicitud.zonaId), solicitud.eventoId, 'NUMERADA');
    const sillas = normalizarSeleccion(zona.distribucion, solicitud.mesa, solicitud.sillas);

    const sufijo = this.generarSufijo();
    return this.registro.registrarNumerada({
      codigo: crearCodigoVenta(sufijo),
      eventoId: solicitud.eventoId,
      zonaId: zona.id,
      vendedorId: solicitud.vendedorId,
      cliente: solicitud.cliente,
      pago: solicitud.pago,
      precioUnitarioCentavos: zona.precioCentavos,
      totalCentavos: calcularTotalCentavos(zona.precioCentavos, sillas.length),
      mesa: solicitud.mesa,
      entradas: sillas.map((silla) => ({
        silla,
        codigo: crearCodigoEntradaNumerada(zona.codigo, solicitud.mesa, silla, sufijo),
      })),
    });
  }
}
