import { describe, expect, it } from 'vitest';

import { calcularTotales, type ResumenZona } from './resumen-ventas';

function zona(overrides: Partial<ResumenZona>): ResumenZona {
  return {
    zonaId: 'z',
    zonaNombre: 'Zona',
    capacidad: 100,
    disponibles: 100,
    entradasVendidas: 0,
    ventas: 0,
    recaudadoCentavos: 0,
    ...overrides,
  };
}

describe('calcularTotales', () => {
  it('suma ventas, entradas y recaudación de todas las zonas', () => {
    const totales = calcularTotales(
      [
        zona({ ventas: 2, entradasVendidas: 5, recaudadoCentavos: 25_000 }),
        zona({ ventas: 1, entradasVendidas: 2, recaudadoCentavos: 20_000 }),
      ],
      4,
    );

    expect(totales).toEqual({ ventas: 3, entradas: 7, recaudadoCentavos: 45_000, ingresados: 4 });
  });
});
