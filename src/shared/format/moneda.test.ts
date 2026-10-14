import { describe, expect, it } from 'vitest';

import { centavosABolivianos, formatearBolivianos } from './moneda';

describe('formatearBolivianos', () => {
  it('muestra montos enteros sin decimales y fracciones con dos', () => {
    expect(formatearBolivianos(10_000)).toMatch(/^Bs\s100$/);
    expect(formatearBolivianos(123_450)).toMatch(/^Bs\s1\.234,5$/);
  });
});

describe('centavosABolivianos', () => {
  it('produce el valor editable para formularios', () => {
    expect(centavosABolivianos(10_000)).toBe('100');
    expect(centavosABolivianos(7_550)).toBe('75.50');
  });
});
