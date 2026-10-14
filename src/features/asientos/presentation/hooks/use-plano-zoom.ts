'use client';

import { useCallback, useState } from 'react';

const ZOOM_MINIMO = 1;
const ZOOM_MAXIMO = 3;
const PASO_ZOOM = 0.25;

function limitarZoom(valor: number): number {
  return Math.min(ZOOM_MAXIMO, Math.max(ZOOM_MINIMO, valor));
}

export function usePlanoZoom() {
  const [zoom, setZoom] = useState(ZOOM_MINIMO);

  const acercar = useCallback(() => setZoom((actual) => limitarZoom(actual + PASO_ZOOM)), []);
  const alejar = useCallback(() => setZoom((actual) => limitarZoom(actual - PASO_ZOOM)), []);
  const restablecer = useCallback(() => setZoom(ZOOM_MINIMO), []);

  return {
    zoom,
    acercar,
    alejar,
    restablecer,
    puedeAcercar: zoom < ZOOM_MAXIMO,
    puedeAlejar: zoom > ZOOM_MINIMO,
  };
}
