import type { Prisma } from '@/generated/prisma/client';

import type { VentaResumen } from '../domain/venta';

export const ventaResumenSelect = {
  id: true,
  codigo: true,
  creadaEn: true,
  clienteNombre: true,
  clienteCelular: true,
  clienteEmail: true,
  cantidad: true,
  totalCentavos: true,
  estado: true,
  zona: { select: { nombre: true } },
  vendedor: { select: { nombre: true } },
  pagos: { take: 1, orderBy: { registradoEn: 'asc' }, select: { metodo: true } },
} satisfies Prisma.VentaSelect;

type VentaResumenRecord = Prisma.VentaGetPayload<{ select: typeof ventaResumenSelect }>;

export function toVentaResumen(record: VentaResumenRecord): VentaResumen {
  return {
    id: record.id,
    codigo: record.codigo,
    creadaEn: record.creadaEn,
    zonaNombre: record.zona.nombre,
    cliente: { nombre: record.clienteNombre, celular: record.clienteCelular, email: record.clienteEmail },
    cantidad: record.cantidad,
    totalCentavos: record.totalCentavos,
    estado: record.estado,
    vendedorNombre: record.vendedor.nombre,
    metodoPago: record.pagos[0]?.metodo ?? null,
  };
}
