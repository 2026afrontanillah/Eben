import type { TransactionClient } from '@/server/db/transaction-client';

import type { NuevaVenta } from '../domain/registro-ventas.repository';
import type { VentaRegistrada } from '../domain/venta';

export interface EntradaACrear {
  codigo: string;
  asientoId: string | null;
}

export function crearVenta(
  tx: TransactionClient,
  venta: NuevaVenta,
  entradas: readonly EntradaACrear[],
): Promise<VentaRegistrada> {
  return tx.venta.create({
    data: {
      codigo: venta.codigo,
      eventoId: venta.eventoId,
      zonaId: venta.zonaId,
      vendedorId: venta.vendedorId,
      clienteNombre: venta.cliente.nombre,
      clienteCelular: venta.cliente.celular,
      clienteEmail: venta.cliente.email,
      cantidad: entradas.length,
      precioUnitarioCentavos: venta.precioUnitarioCentavos,
      totalCentavos: venta.totalCentavos,
      entradas: {
        createMany: {
          data: entradas.map((entrada) => ({
            codigo: entrada.codigo,
            zonaId: venta.zonaId,
            asientoId: entrada.asientoId,
          })),
        },
      },
      pagos: {
        create: {
          metodo: venta.pago.metodo,
          referencia: venta.pago.referencia,
          montoCentavos: venta.totalCentavos,
          registradoPorId: venta.vendedorId,
        },
      },
    },
    select: { id: true, codigo: true },
  });
}
