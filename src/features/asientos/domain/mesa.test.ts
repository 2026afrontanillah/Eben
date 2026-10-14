import { describe, expect, it } from 'vitest';

import { agruparEnMesas, contarSillasLibres, estaCompleta, estaLibre } from './mesa';

describe('agruparEnMesas', () => {
  it('agrupa y ordena mesas y sillas', () => {
    const mesas = agruparEnMesas([
      { mesa: 2, silla: 2, vendido: false },
      { mesa: 1, silla: 2, vendido: true },
      { mesa: 2, silla: 1, vendido: false },
      { mesa: 1, silla: 1, vendido: true },
    ]);

    expect(mesas.map((mesa) => mesa.numero)).toEqual([1, 2]);
    expect(mesas[1]?.sillas.map((silla) => silla.numero)).toEqual([1, 2]);
  });

  it('calcula el estado de cada mesa', () => {
    const [completa, parcial, libre] = agruparEnMesas([
      { mesa: 1, silla: 1, vendido: true },
      { mesa: 2, silla: 1, vendido: true },
      { mesa: 2, silla: 2, vendido: false },
      { mesa: 3, silla: 1, vendido: false },
    ]);

    expect(completa && estaCompleta(completa)).toBe(true);
    expect(parcial && contarSillasLibres(parcial)).toBe(1);
    expect(libre && estaLibre(libre)).toBe(true);
  });
});
