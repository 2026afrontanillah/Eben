export function crearCodigoVenta(sufijo: string): string {
  return `V-${sufijo}`;
}

export function crearCodigoEntradaGeneral(zonaCodigo: string, sufijo: string, indice: number): string {
  return `${zonaCodigo}-${sufijo}-${String(indice).padStart(3, '0')}`;
}

export function crearCodigoEntradaNumerada(zonaCodigo: string, mesa: number, silla: number, sufijo: string): string {
  return `${zonaCodigo}-M${mesa}-S${silla}-${sufijo}`;
}
