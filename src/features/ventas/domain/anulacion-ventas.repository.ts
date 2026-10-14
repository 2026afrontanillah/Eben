export interface SolicitudAnulacion {
  ventaId: string;
  anuladaPorId: string;
  motivo: string;
  fecha: Date;
}

export interface AnulacionVentasRepository {
  /** Anula la venta, sus entradas y libera el stock y las sillas en una sola transacción. */
  anular(solicitud: SolicitudAnulacion): Promise<void>;
}
