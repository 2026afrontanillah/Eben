import type { Prisma, PrismaClient } from '@/generated/prisma/client';

import type { ConsultaVentasRepository, FiltroVentas } from '../domain/consulta-ventas.repository';
import type { VentaDetalle, VentaResumen } from '../domain/venta';
import { toVentaDetalle, ventaDetalleSelect } from './venta-detalle.mapper';
import { toVentaResumen, ventaResumenSelect } from './venta-resumen.mapper';

function construirFiltroBusqueda(busqueda: string): Prisma.VentaWhereInput {
  const contiene = { contains: busqueda, mode: 'insensitive' } as const;
  return {
    OR: [
      { codigo: contiene },
      { clienteNombre: contiene },
      { clienteCelular: { contains: busqueda } },
      { entradas: { some: { codigo: contiene } } },
    ],
  };
}

export class PrismaConsultaVentasRepository implements ConsultaVentasRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async obtenerDetalle(ventaId: string): Promise<VentaDetalle | null> {
    const venta = await this.prisma.venta.findUnique({ where: { id: ventaId }, select: ventaDetalleSelect });
    return venta ? toVentaDetalle(venta) : null;
  }

  async listar(filtro: FiltroVentas): Promise<VentaResumen[]> {
    const ventas = await this.prisma.venta.findMany({
      where: {
        vendedorId: filtro.vendedorId,
        ...(filtro.busqueda ? construirFiltroBusqueda(filtro.busqueda) : {}),
      },
      orderBy: { creadaEn: 'desc' },
      take: filtro.limite,
      select: ventaResumenSelect,
    });
    return ventas.map(toVentaResumen);
  }
}
