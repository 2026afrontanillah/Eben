import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { PrismaControlAccesoRepository } from '@/features/entradas/data/prisma-control-acceso.repository';
import { VentaNoAnulableError } from '@/features/ventas/domain/ventas.errors';

import { CLIENTE, crearCasosDeUso, PAGO } from './support/casos-de-uso';
import { createTestPrisma, limpiarBaseDeDatos } from './support/database';
import { crearEscenario, type Escenario } from './support/escenario';

const prisma = createTestPrisma();
const casos = crearCasosDeUso(prisma);
const controlAcceso = new PrismaControlAccesoRepository(prisma);
let escenario: Escenario;

beforeEach(async () => {
  await limpiarBaseDeDatos(prisma);
  escenario = await crearEscenario(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

function venderMesa(sillas: number[]) {
  return casos.venderAsientos.ejecutar({
    eventoId: escenario.eventoId,
    zonaId: escenario.zonaNumeradaId,
    mesa: 2,
    sillas,
    cliente: CLIENTE,
    pago: PAGO,
    vendedorId: escenario.vendedorId,
  });
}

function anular(ventaId: string) {
  return casos.anularVenta.ejecutar({ ventaId, motivo: 'Cliente desistió', usuarioId: escenario.vendedorId });
}

describe('anulación de ventas', () => {
  it('libera las sillas, devuelve el stock e invalida las entradas', async () => {
    const venta = await venderMesa([1, 2, 3]);

    await anular(venta.id);

    const [asientosVendidos, zona, entradas, ventaAnulada] = await Promise.all([
      prisma.asiento.count({ where: { zonaId: escenario.zonaNumeradaId, estado: 'VENDIDO' } }),
      prisma.zona.findUniqueOrThrow({ where: { id: escenario.zonaNumeradaId } }),
      prisma.entrada.findMany({ where: { ventaId: venta.id }, select: { estado: true } }),
      prisma.venta.findUniqueOrThrow({ where: { id: venta.id } }),
    ]);
    expect(asientosVendidos).toBe(0);
    expect(zona.disponibles).toBe(zona.capacidad);
    expect(entradas.every((entrada) => entrada.estado === 'ANULADA')).toBe(true);
    expect(ventaAnulada).toMatchObject({ estado: 'ANULADA', motivoAnulacion: 'Cliente desistió' });

    await expect(venderMesa([1, 2, 3])).resolves.toBeDefined();
  });

  it('no permite anular dos veces la misma venta', async () => {
    const venta = await venderMesa([4]);

    const resultados = await Promise.allSettled([anular(venta.id), anular(venta.id)]);

    expect(resultados.filter((resultado) => resultado.status === 'fulfilled')).toHaveLength(1);
    const zona = await prisma.zona.findUniqueOrThrow({ where: { id: escenario.zonaNumeradaId } });
    expect(zona.disponibles).toBe(zona.capacidad);
  });

  it('no permite anular si una entrada ya se usó en la puerta y no cambia nada', async () => {
    const venta = await venderMesa([5, 6]);
    const entrada = await prisma.entrada.findFirstOrThrow({ where: { ventaId: venta.id } });
    await controlAcceso.registrarIngreso(entrada.id, escenario.porteroId, new Date());

    await expect(anular(venta.id)).rejects.toBeInstanceOf(VentaNoAnulableError);

    const [ventaActual, asientosVendidos] = await Promise.all([
      prisma.venta.findUniqueOrThrow({ where: { id: venta.id } }),
      prisma.asiento.count({ where: { zonaId: escenario.zonaNumeradaId, estado: 'VENDIDO' } }),
    ]);
    expect(ventaActual.estado).toBe('CONFIRMADA');
    expect(asientosVendidos).toBe(2);
  });
});

describe('control de acceso', () => {
  it('una entrada solo puede ingresar una vez aunque la escaneen en paralelo', async () => {
    const venta = await venderMesa([7]);
    const entrada = await prisma.entrada.findFirstOrThrow({ where: { ventaId: venta.id } });

    const registros = await Promise.all(
      Array.from({ length: 5 }, () => controlAcceso.registrarIngreso(entrada.id, escenario.porteroId, new Date())),
    );

    expect(registros.filter(Boolean)).toHaveLength(1);
  });
});
