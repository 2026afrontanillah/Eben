import type { Prisma } from '@/generated/prisma/client';

import type { VentaDetalle } from '../domain/venta';

export const ventaDetalleSelect = {
  id: true,
  codigo: true,
  clienteNombre: true,
  clienteCelular: true,
  clienteEmail: true,
  cantidad: true,
  precioUnitarioCentavos: true,
  totalCentavos: true,
  estado: true,
  creadaEn: true,
  anuladaEn: true,
  motivoAnulacion: true,
  anuladaPor: { select: { nombre: true } },
  evento: { select: { id: true, nombre: true } },
  zona: { select: { id: true, codigo: true, nombre: true } },
  vendedor: { select: { id: true, nombre: true } },
  pagos: {
    orderBy: { registradoEn: 'asc' },
    select: {
      metodo: true,
      montoCentavos: true,
      referencia: true,
      registradoEn: true,
      registradoPor: { select: { nombre: true } },
    },
  },
  entradas: {
    orderBy: { codigo: 'asc' },
    select: {
      id: true,
      codigo: true,
      estado: true,
      usadaEn: true,
      asiento: { select: { mesa: true, silla: true } },
    },
  },
} satisfies Prisma.VentaSelect;

type VentaDetalleRecord = Prisma.VentaGetPayload<{ select: typeof ventaDetalleSelect }>;

export function toVentaDetalle(record: VentaDetalleRecord): VentaDetalle {
  return {
    id: record.id,
    codigo: record.codigo,
    evento: record.evento,
    zona: record.zona,
    vendedor: record.vendedor,
    cliente: { nombre: record.clienteNombre, celular: record.clienteCelular, email: record.clienteEmail },
    cantidad: record.cantidad,
    precioUnitarioCentavos: record.precioUnitarioCentavos,
    totalCentavos: record.totalCentavos,
    estado: record.estado,
    creadaEn: record.creadaEn,
    anulacion:
      record.anuladaEn && record.motivoAnulacion
        ? {
            fecha: record.anuladaEn,
            motivo: record.motivoAnulacion,
            anuladaPorNombre: record.anuladaPor?.nombre ?? 'Desconocido',
          }
        : null,
    pagos: record.pagos.map((pago) => ({
      metodo: pago.metodo,
      montoCentavos: pago.montoCentavos,
      referencia: pago.referencia,
      registradoEn: pago.registradoEn,
      registradoPorNombre: pago.registradoPor.nombre,
    })),
    entradas: record.entradas.map((entrada) => ({
      id: entrada.id,
      codigo: entrada.codigo,
      estado: entrada.estado,
      usadaEn: entrada.usadaEn,
      ubicacion: entrada.asiento ? { mesa: entrada.asiento.mesa, silla: entrada.asiento.silla } : null,
    })),
  };
}
