import { calcularPorcentajeDisponible, type Zona } from '../../domain/zona';

const COLOR_FONDO = '#050506';

/** El tramo vendido se pinta con el mismo color muy oscurecido: el bloque "se vacía" de arriba hacia abajo. */
export function construirFondoZona(zona: Zona): string {
  if (zona.capacidad === 0) {
    return zona.color;
  }

  const colorVendido = `color-mix(in oklab, ${zona.color} 22%, ${COLOR_FONDO})`;

  const porcentaje = calcularPorcentajeDisponible(zona).toFixed(2);
  return `linear-gradient(to top, ${zona.color} 0%, ${zona.color} ${porcentaje}%, ${colorVendido} ${porcentaje}%, ${colorVendido} 100%)`;
}
