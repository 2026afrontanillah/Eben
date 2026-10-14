import type { Zona } from '@/features/eventos/domain/zona';

export const EVENTO_ID = '11111111-1111-4111-8111-111111111111';

export function crearZonaGeneral(overrides: Partial<Zona> = {}): Zona {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    eventoId: EVENTO_ID,
    codigo: 'GEN',
    nombre: 'General',
    tipo: 'GENERAL',
    precioCentavos: 5_000,
    capacidad: 100,
    disponibles: 100,
    habilitada: true,
    areaPlano: '1 / 1 / 2 / 2',
    color: '#34D399',
    orden: 1,
    distribucion: null,
    ...overrides,
  };
}

export function crearZonaNumerada(overrides: Partial<Zona> = {}): Zona {
  return crearZonaGeneral({
    id: '33333333-3333-4333-8333-333333333333',
    codigo: 'VIP',
    nombre: 'VIP grande',
    tipo: 'NUMERADA',
    precioCentavos: 10_000,
    capacidad: 1_400,
    disponibles: 1_400,
    distribucion: { mesas: 140, sillasPorMesa: 10, mesasPorFila: 20 },
    ...overrides,
  });
}
