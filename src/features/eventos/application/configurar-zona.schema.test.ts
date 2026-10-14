import { describe, expect, it } from 'vitest';

import { configurarZonaSchema } from './configurar-zona.schema';

const ZONA_ID = '22222222-2222-4222-8222-222222222222';

function parsearPrecio(precio: string) {
  return configurarZonaSchema.safeParse({ zonaId: ZONA_ID, precio, habilitada: true });
}

describe('configurarZonaSchema', () => {
  it.each([
    ['100', 10_000],
    ['75.50', 7_550],
    ['75,5', 7_550],
    ['', null],
  ])('convierte "%s" a %s centavos', (precio, centavos) => {
    expect(parsearPrecio(precio).data?.precio).toBe(centavos);
  });

  it.each(['0', '-5', 'abc', '10.999'])('rechaza el precio "%s"', (precio) => {
    expect(parsearPrecio(precio).success).toBe(false);
  });
});
