import type { Prisma, PrismaClient } from '@/generated/prisma/client';

import type { ReportesRepository } from '../domain/reportes.repository';
import type { ResumenMetodoPago, ResumenVendedor, ResumenZona } from '../domain/resumen-ventas';

function ventasConfirmadas(eventoId: string): Prisma.VentaWhereInput {
  return { eventoId, estado: 'CONFIRMADA' };
}

export class PrismaReportesRepository implements ReportesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async resumirPorZona(eventoId: string): Promise<ResumenZona[]> {
    const [zonas, ventasPorZona] = await Promise.all([
      this.prisma.zona.findMany({
        where: { eventoId },
        orderBy: { orden: 'asc' },
        select: { id: true, nombre: true, capacidad: true, disponibles: true },
      }),
      this.prisma.venta.groupBy({
        by: ['zonaId'],
        where: ventasConfirmadas(eventoId),
        _sum: { totalCentavos: true, cantidad: true },
        _count: { _all: true },
      }),
    ]);

    const ventasPorZonaId = new Map(ventasPorZona.map((grupo) => [grupo.zonaId, grupo]));
    return zonas.map((zona) => {
      const grupo = ventasPorZonaId.get(zona.id);
      return {
        zonaId: zona.id,
        zonaNombre: zona.nombre,
        capacidad: zona.capacidad,
        disponibles: zona.disponibles,
        entradasVendidas: grupo?._sum.cantidad ?? 0,
        ventas: grupo?._count._all ?? 0,
        recaudadoCentavos: grupo?._sum.totalCentavos ?? 0,
      };
    });
  }

  async resumirPorMetodoPago(eventoId: string): Promise<ResumenMetodoPago[]> {
    const grupos = await this.prisma.pago.groupBy({
      by: ['metodo'],
      where: { venta: ventasConfirmadas(eventoId) },
      _sum: { montoCentavos: true },
      _count: { _all: true },
      orderBy: { metodo: 'asc' },
    });

    return grupos.map((grupo) => ({
      metodo: grupo.metodo,
      pagos: grupo._count._all,
      montoCentavos: grupo._sum.montoCentavos ?? 0,
    }));
  }

  async resumirPorVendedor(eventoId: string): Promise<ResumenVendedor[]> {
    const grupos = await this.prisma.venta.groupBy({
      by: ['vendedorId'],
      where: ventasConfirmadas(eventoId),
      _sum: { cantidad: true, totalCentavos: true },
      _count: { _all: true },
    });

    const vendedores = await this.prisma.usuario.findMany({
      where: { id: { in: grupos.map((grupo) => grupo.vendedorId) } },
      select: { id: true, nombre: true, rol: true },
    });
    const vendedorPorId = new Map(vendedores.map((vendedor) => [vendedor.id, vendedor]));

    return grupos
      .map((grupo) => {
        const vendedor = vendedorPorId.get(grupo.vendedorId);
        return {
          vendedorId: grupo.vendedorId,
          vendedorNombre: vendedor?.nombre ?? 'Usuario eliminado',
          rol: vendedor?.rol ?? 'VENDEDOR',
          ventas: grupo._count._all,
          entradas: grupo._sum.cantidad ?? 0,
          montoCentavos: grupo._sum.totalCentavos ?? 0,
        };
      })
      .sort((a, b) => b.montoCentavos - a.montoCentavos);
  }

  contarIngresados(eventoId: string): Promise<number> {
    return this.prisma.entrada.count({ where: { estado: 'USADA', zona: { eventoId } } });
  }
}
