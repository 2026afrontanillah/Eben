import type { PrismaClient } from '@/generated/prisma/client';
import type { TransactionClient } from '@/server/db/transaction-client';

import type { AnulacionVentasRepository, SolicitudAnulacion } from '../domain/anulacion-ventas.repository';
import { VentaNoAnulableError, VentaNoEncontradaError } from '../domain/ventas.errors';

interface VentaAnulada {
  zonaId: string;
  cantidad: number;
}

export class PrismaAnulacionVentasRepository implements AnulacionVentasRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async anular(solicitud: SolicitudAnulacion): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const venta = await marcarVentaAnulada(tx, solicitud);
      const asientoIds = await anularEntradas(tx, solicitud.ventaId, venta.cantidad);

      if (asientoIds.length > 0) {
        await tx.asiento.updateMany({ where: { id: { in: asientoIds } }, data: { estado: 'DISPONIBLE' } });
      }
      await tx.zona.update({ where: { id: venta.zonaId }, data: { disponibles: { increment: venta.cantidad } } });
    });
  }
}

/** Se actualiza la venta primero para que una segunda anulación concurrente quede bloqueada aquí. */
async function marcarVentaAnulada(tx: TransactionClient, solicitud: SolicitudAnulacion): Promise<VentaAnulada> {
  const [venta] = await tx.venta.updateManyAndReturn({
    where: { id: solicitud.ventaId, estado: 'CONFIRMADA' },
    data: {
      estado: 'ANULADA',
      anuladaEn: solicitud.fecha,
      anuladaPorId: solicitud.anuladaPorId,
      motivoAnulacion: solicitud.motivo,
    },
    select: { zonaId: true, cantidad: true },
  });
  if (venta) {
    return venta;
  }

  const existente = await tx.venta.findUnique({ where: { id: solicitud.ventaId }, select: { id: true } });
  throw existente ? new VentaNoAnulableError('la venta ya está anulada') : new VentaNoEncontradaError();
}

async function anularEntradas(tx: TransactionClient, ventaId: string, cantidadEsperada: number): Promise<string[]> {
  const entradas = await tx.entrada.updateManyAndReturn({
    where: { ventaId, estado: 'VALIDA' },
    data: { estado: 'ANULADA' },
    select: { asientoId: true },
  });

  if (entradas.length !== cantidadEsperada) {
    throw new VentaNoAnulableError('una o más entradas ya fueron usadas en la puerta');
  }

  return entradas.map((entrada) => entrada.asientoId).filter((asientoId): asientoId is string => asientoId !== null);
}
