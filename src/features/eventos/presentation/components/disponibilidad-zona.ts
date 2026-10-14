import { obtenerEstadoZona, type Zona } from '../../domain/zona';

function describirEstadoNoVendible(zona: Zona): string | null {
  switch (obtenerEstadoZona(zona)) {
    case 'NO_HABILITADA':
      return 'No disponible';
    case 'SIN_PRECIO':
      return 'Sin precio';
    case 'AGOTADA':
      return 'Agotado';
    case 'A_LA_VENTA':
      return null;
  }
}

export function describirDisponibilidad(zona: Zona): string {
  return describirEstadoNoVendible(zona) ?? `${zona.disponibles} / ${zona.capacidad} disponibles`;
}

/** Versión breve para las zonas angostas del plano en pantallas de celular. */
export function describirDisponibilidadCorta(zona: Zona): string {
  return describirEstadoNoVendible(zona) ?? `${zona.disponibles} libres`;
}
