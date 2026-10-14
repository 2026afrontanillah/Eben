const bolivianosFormatter = new Intl.NumberFormat('es-BO', {
  style: 'currency',
  currency: 'BOB',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatearBolivianos(centavos: number): string {
  return bolivianosFormatter.format(centavos / 100);
}

export function centavosABolivianos(centavos: number): string {
  return (centavos / 100).toFixed(2).replace(/\.00$/, '');
}
