import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { AsientosNoDisponiblesError, StockInsuficienteError } from '@/features/ventas/domain/ventas.errors';

import { CLIENTE, crearCasosDeUso, PAGO } from './support/casos-de-uso';
import { createTestPrisma, limpiarBaseDeDatos } from './support/database';
import { CAPACIDAD_GENERAL, crearEscenario, type Escenario } from './support/escenario';

const prisma = createTestPrisma();
const casos = crearCasosDeUso(prisma);
let escenario: Escenario;

beforeEach(async () => {
  await limpiarBaseDeDatos(prisma);
  escenario = await crearEscenario(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

function venderSillas(sillas: number[]) {
  return casos.venderAsientos.ejecutar({
    eventoId: escenario.eventoId,
    zonaId: escenario.zonaNumeradaId,
    mesa: 1,
    sillas,
    cliente: CLIENTE,
    pago: PAGO,
    vendedorId: escenario.vendedorId,
  });
}

describe('ventas simultáneas', () => {
  it('diez vendedores compitiendo por la misma silla: solo uno la vende', async () => {
    const resultados = await Promise.allSettled(Array.from({ length: 10 }, () => venderSillas([5])));

    const exitosas = resultados.filter((resultado) => resultado.status === 'fulfilled');
    const rechazadas = resultados.filter((resultado) => resultado.status === 'rejected');
    expect(exitosas).toHaveLength(1);
    expect(rechazadas.every((resultado) => resultado.reason instanceof AsientosNoDisponiblesError)).toBe(true);

    const [entradas, zona] = await Promise.all([
      prisma.entrada.count({ where: { asiento: { mesa: 1, silla: 5 } } }),
      prisma.zona.findUniqueOrThrow({ where: { id: escenario.zonaNumeradaId } }),
    ]);
    expect(entradas).toBe(1);
    expect(zona.disponibles).toBe(zona.capacidad - 1);
  });

  it('selecciones que se superponen no dejan ventas parciales', async () => {
    const resultados = await Promise.allSettled([venderSillas([1, 2]), venderSillas([2, 3])]);

    expect(resultados.filter((resultado) => resultado.status === 'fulfilled')).toHaveLength(1);
    const vendidas = await prisma.asiento.findMany({
      where: { zonaId: escenario.zonaNumeradaId, estado: 'VENDIDO' },
      select: { silla: true },
      orderBy: { silla: 'asc' },
    });
    expect([[1, 2], [2, 3]]).toContainEqual(vendidas.map((asiento) => asiento.silla));
  });

  it('nunca se vende más que la capacidad de una zona general', async () => {
    const intentos = Array.from({ length: 6 }, () =>
      casos.venderGenerales.ejecutar({
        eventoId: escenario.eventoId,
        zonaId: escenario.zonaGeneralId,
        cantidad: 20,
        cliente: CLIENTE,
        pago: PAGO,
        vendedorId: escenario.vendedorId,
      }),
    );

    const resultados = await Promise.allSettled(intentos);

    expect(resultados.filter((resultado) => resultado.status === 'fulfilled')).toHaveLength(5);
    const rechazo = resultados.find((resultado) => resultado.status === 'rejected');
    expect(rechazo?.status === 'rejected' && rechazo.reason).toBeInstanceOf(StockInsuficienteError);

    const [zona, entradas] = await Promise.all([
      prisma.zona.findUniqueOrThrow({ where: { id: escenario.zonaGeneralId } }),
      prisma.entrada.count({ where: { zonaId: escenario.zonaGeneralId } }),
    ]);
    expect(zona.disponibles).toBe(0);
    expect(entradas).toBe(CAPACIDAD_GENERAL);
  });

  it('registra el pago por el total de la venta', async () => {
    const venta = await venderSillas([4, 6]);

    const pago = await prisma.pago.findFirstOrThrow({ where: { ventaId: venta.id } });
    expect(pago).toMatchObject({ metodo: 'EFECTIVO', montoCentavos: 20_000, registradoPorId: escenario.vendedorId });
  });
});
