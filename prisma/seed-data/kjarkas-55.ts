import type { TipoZona } from '../../src/generated/prisma/client';

export interface ZonaSemilla {
  codigo: string;
  nombre: string;
  tipo: TipoZona;
  precioCentavos: number | null;
  capacidad: number;
  habilitada: boolean;
  areaPlano: string;
  color: string;
  orden: number;
  mesas?: number;
  sillasPorMesa?: number;
  mesasPorFila?: number;
}

export const EVENTO_KJARKAS_55 = {
  slug: 'kjarkas-55',
  nombre: 'Kjarkas 55 años',
  planoColumnas: '1fr 2.4fr 1fr',
  planoFilas: 'clamp(90px, 14vw, 110px) clamp(135px, 20vw, 160px) 72px',
} as const;

const SILLAS_POR_MESA = 10;

/** General y Gradería quedan sin precio: el administrador debe definirlo antes de habilitar la venta. */
export const ZONAS_KJARKAS_55: readonly ZonaSemilla[] = [
  {
    codigo: 'VIP',
    nombre: 'VIP grande',
    tipo: 'NUMERADA',
    precioCentavos: 10_000,
    capacidad: 140 * SILLAS_POR_MESA,
    habilitada: true,
    areaPlano: '1 / 1 / 3 / 2',
    color: '#15803D',
    orden: 1,
    mesas: 140,
    sillasPorMesa: SILLAS_POR_MESA,
    mesasPorFila: 20,
  },
  {
    codigo: 'GEN',
    nombre: 'General',
    tipo: 'GENERAL',
    precioCentavos: null,
    capacidad: 100,
    habilitada: true,
    areaPlano: '1 / 2 / 3 / 3',
    color: '#6D28D9',
    orden: 2,
  },
  {
    codigo: 'VIPS',
    nombre: 'VIP pequeño',
    tipo: 'NUMERADA',
    precioCentavos: 10_000,
    capacidad: 70 * SILLAS_POR_MESA,
    habilitada: true,
    areaPlano: '1 / 3 / 2 / 4',
    color: '#EA580C',
    orden: 3,
    mesas: 70,
    sillasPorMesa: SILLAS_POR_MESA,
    mesasPorFila: 10,
  },
  {
    codigo: 'CAM',
    nombre: 'Camarote',
    tipo: 'GENERAL',
    precioCentavos: null,
    capacidad: 0,
    habilitada: false,
    areaPlano: '2 / 3 / 3 / 4',
    color: '#BE123C',
    orden: 4,
  },
  {
    codigo: 'GRA',
    nombre: 'Gradería',
    tipo: 'GENERAL',
    precioCentavos: null,
    capacidad: 100,
    habilitada: true,
    areaPlano: '3 / 1 / 4 / 4',
    color: '#0E7490',
    orden: 5,
  },
];
