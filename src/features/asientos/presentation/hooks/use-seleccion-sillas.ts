'use client';

import { useCallback, useMemo, useState } from 'react';

import { esSillaVendida, type SillaEstado } from '../../domain/mesa';

export function useSeleccionSillas(sillas: readonly SillaEstado[]) {
  const [elegidas, setElegidas] = useState<ReadonlySet<number>>(() => new Set());

  const vendidas = useMemo(
    () => new Set(sillas.filter(esSillaVendida).map((silla) => silla.numero)),
    [sillas],
  );

  // Se deriva en cada render para descartar sillas que otro vendedor acaba de vender.
  const seleccion = useMemo(
    () => new Set([...elegidas].filter((numero) => !vendidas.has(numero)).sort((a, b) => a - b)),
    [elegidas, vendidas],
  );

  const alternar = useCallback(
    (numero: number) => {
      if (vendidas.has(numero)) {
        return;
      }
      setElegidas((actual) => {
        const siguiente = new Set(actual);
        if (siguiente.has(numero)) {
          siguiente.delete(numero);
        } else {
          siguiente.add(numero);
        }
        return siguiente;
      });
    },
    [vendidas],
  );

  const limpiar = useCallback(() => setElegidas(new Set()), []);

  return { seleccion, alternar, limpiar };
}
