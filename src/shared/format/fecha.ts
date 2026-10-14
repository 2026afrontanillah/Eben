const ZONA_HORARIA_BOLIVIA = 'America/La_Paz';

const fechaHoraFormatter = new Intl.DateTimeFormat('es-BO', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: ZONA_HORARIA_BOLIVIA,
});

export function formatearFechaHora(fecha: Date | string): string {
  if (!fecha) return '';
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return fechaHoraFormatter.format(d);
}
