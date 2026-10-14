export interface PosicionSilla {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const MESA_VIEWBOX = { width: 64, height: 98 } as const;

const FILAS_LATERALES_Y = [17, 34, 51, 68] as const;

/** Silla 1 arriba, silla 2 abajo y de la 3 a la 10 alternando izquierda/derecha, como en el plano impreso. */
export const POSICIONES_SILLAS: readonly PosicionSilla[] = [
  { x: 24, y: 1, width: 16, height: 11 },
  { x: 24, y: 86, width: 16, height: 11 },
  ...FILAS_LATERALES_Y.flatMap((y) => [
    { x: 3, y, width: 12, height: 12 },
    { x: 49, y, width: 12, height: 12 },
  ]),
];
