import type { PrismaClient } from '@/generated/prisma/client';

import type {
  NuevaVentaGeneral,
  NuevaVentaNumerada,
  RegistroVentasRepository,
} from '../domain/registro-ventas.repository';
import type { VentaRegistrada } from '../domain/venta';
import { crearVenta } from './crear-venta';
import { reservarAsientos, reservarCupos } from './reservas';

export class PrismaRegistroVentasRepository implements RegistroVentasRepository {
  constructor(private readonly prisma: PrismaClient) {}

  registrarGeneral(venta: NuevaVentaGeneral): Promise<VentaRegistrada> {
    return this.prisma.$transaction(async (tx) => {
      await reservarCupos(tx, venta.zonaId, venta.codigosEntrada.length);
      return crearVenta(
        tx,
        venta,
        venta.codigosEntrada.map((codigo) => ({ codigo, asientoId: null })),
      );
    });
  }

  registrarNumerada(venta: NuevaVentaNumerada): Promise<VentaRegistrada> {
    const sillas = venta.entradas.map((entrada) => entrada.silla);

    return this.prisma.$transaction(async (tx) => {
      const asientoPorSilla = await reservarAsientos(tx, venta.zonaId, venta.mesa, sillas);
      await reservarCupos(tx, venta.zonaId, sillas.length);
      return crearVenta(
        tx,
        venta,
        venta.entradas.map((entrada) => ({
          codigo: entrada.codigo,
          asientoId: asientoPorSilla.get(entrada.silla) ?? null,
        })),
      );
    });
  }
}
