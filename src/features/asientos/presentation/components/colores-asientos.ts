interface ColoresElemento {
  fill: string;
  stroke: string;
  texto: string;
}

/** Verde = libre, blanco = elegida y gris = vendida: se distinguen de un vistazo sobre el fondo oscuro. */
export const COLORES_SILLA: Record<'disponible' | 'seleccionada' | 'vendida', ColoresElemento> = {
  disponible: { fill: '#22C55E', stroke: '#4ADE80', texto: '#052E16' },
  seleccionada: { fill: '#FFFFFF', stroke: '#FFFFFF', texto: '#050506' },
  vendida: { fill: '#3F3F46', stroke: '#52525B', texto: '#A1A1AA' },
};

export const COLORES_MESA: Record<'libre' | 'parcial' | 'completa', ColoresElemento> = {
  libre: { fill: '#15803D', stroke: '#22C55E', texto: '#FFFFFF' },
  parcial: { fill: '#14532D', stroke: '#22C55E', texto: '#FFFFFF' },
  completa: { fill: '#27272A', stroke: '#3F3F46', texto: '#A1A1AA' },
};
