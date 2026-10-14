export const METODOS_PAGO = ['EFECTIVO', 'QR', 'TRANSFERENCIA', 'TARJETA'] as const;

export type MetodoPago = (typeof METODOS_PAGO)[number];

export const ETIQUETAS_METODO_PAGO: Record<MetodoPago, string> = {
  EFECTIVO: 'Efectivo',
  QR: 'QR bancario',
  TRANSFERENCIA: 'Transferencia',
  TARJETA: 'Tarjeta',
};

/** Los pagos electrónicos exigen el número de comprobante para poder conciliarlos con el banco. */
export function requiereReferencia(metodo: MetodoPago): boolean {
  return metodo === 'QR' || metodo === 'TRANSFERENCIA';
}
