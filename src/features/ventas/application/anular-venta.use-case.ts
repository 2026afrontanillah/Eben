import { isUuid } from '@/shared/validation/uuid';

import type { AnulacionVentasRepository } from '../domain/anulacion-ventas.repository';
import { LONGITUD_MINIMA_MOTIVO_ANULACION } from '../domain/reglas-venta';
import { VentaNoAnulableError, VentaNoEncontradaError } from '../domain/ventas.errors';

export interface AnulacionSolicitud {
  ventaId: string;
  motivo: string;
  usuarioId: string;
}

export class AnularVentaUseCase {
  constructor(
    private readonly anulacion: AnulacionVentasRepository,
    private readonly ahora: () => Date = () => new Date(),
  ) {}

  async ejecutar(solicitud: AnulacionSolicitud): Promise<void> {
    if (!isUuid(solicitud.ventaId)) {
      throw new VentaNoEncontradaError();
    }

    const motivo = solicitud.motivo.trim();
    if (motivo.length < LONGITUD_MINIMA_MOTIVO_ANULACION) {
      throw new VentaNoAnulableError('indica el motivo de la anulación');
    }

    await this.anulacion.anular({
      ventaId: solicitud.ventaId,
      anuladaPorId: solicitud.usuarioId,
      motivo,
      fecha: this.ahora(),
    });
  }
}
