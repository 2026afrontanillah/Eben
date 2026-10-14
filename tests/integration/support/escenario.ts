import type { PrismaClient } from '@/generated/prisma/client';

export interface Escenario {
  eventoId: string;
  zonaGeneralId: string;
  zonaNumeradaId: string;
  vendedorId: string;
  porteroId: string;
}

export const CAPACIDAD_GENERAL = 100;
export const MESAS_NUMERADAS = 2;
export const SILLAS_POR_MESA = 10;

export async function crearEscenario(prisma: PrismaClient): Promise<Escenario> {
  const evento = await prisma.evento.create({
    data: { slug: 'evento-prueba', nombre: 'Evento de prueba', planoColumnas: '1fr', planoFilas: '100px' },
  });

  const zonaGeneral = await prisma.zona.create({
    data: {
      eventoId: evento.id,
      codigo: 'GEN',
      nombre: 'General',
      tipo: 'GENERAL',
      precioCentavos: 5_000,
      capacidad: CAPACIDAD_GENERAL,
      disponibles: CAPACIDAD_GENERAL,
      areaPlano: '1 / 1 / 2 / 2',
      color: '#34D399',
      orden: 1,
    },
  });

  const capacidadNumerada = MESAS_NUMERADAS * SILLAS_POR_MESA;
  const zonaNumerada = await prisma.zona.create({
    data: {
      eventoId: evento.id,
      codigo: 'VIP',
      nombre: 'VIP',
      tipo: 'NUMERADA',
      precioCentavos: 10_000,
      capacidad: capacidadNumerada,
      disponibles: capacidadNumerada,
      areaPlano: '1 / 1 / 2 / 2',
      color: '#6EE7B7',
      orden: 2,
      mesas: MESAS_NUMERADAS,
      sillasPorMesa: SILLAS_POR_MESA,
      mesasPorFila: MESAS_NUMERADAS,
    },
  });

  await prisma.asiento.createMany({
    data: Array.from({ length: MESAS_NUMERADAS }, (_, mesa) =>
      Array.from({ length: SILLAS_POR_MESA }, (__, silla) => ({ zonaId: zonaNumerada.id, mesa: mesa + 1, silla: silla + 1 })),
    ).flat(),
  });

  const [vendedor, portero] = await Promise.all([
    prisma.usuario.create({ data: { nombre: 'Vendedora', email: 'vendedora@test.bo', passwordHash: 'x', rol: 'VENDEDOR' } }),
    prisma.usuario.create({ data: { nombre: 'Portero', email: 'portero@test.bo', passwordHash: 'x', rol: 'CONTROL' } }),
  ]);

  return {
    eventoId: evento.id,
    zonaGeneralId: zonaGeneral.id,
    zonaNumeradaId: zonaNumerada.id,
    vendedorId: vendedor.id,
    porteroId: portero.id,
  };
}
