export interface EstadoAsiento {
  mesa: number;
  silla: number;
  vendido: boolean;
}

export interface SillaEstado {
  numero: number;
  vendida: boolean;
}

export interface MesaEstado {
  numero: number;
  sillas: SillaEstado[];
}

export function agruparEnMesas(asientos: readonly EstadoAsiento[]): MesaEstado[] {
  const sillasPorMesa = new Map<number, SillaEstado[]>();

  for (const asiento of asientos) {
    const sillas = sillasPorMesa.get(asiento.mesa) ?? [];
    sillas.push({ numero: asiento.silla, vendida: asiento.vendido });
    sillasPorMesa.set(asiento.mesa, sillas);
  }

  return [...sillasPorMesa.entries()]
    .sort(([mesaA], [mesaB]) => mesaA - mesaB)
    .map(([numero, sillas]) => ({ numero, sillas: sillas.sort((a, b) => a.numero - b.numero) }));
}

export function contarSillasLibres(mesa: MesaEstado): number {
  return mesa.sillas.filter((silla) => !silla.vendida).length;
}

export function estaCompleta(mesa: MesaEstado): boolean {
  return contarSillasLibres(mesa) === 0;
}

export function estaLibre(mesa: MesaEstado): boolean {
  return contarSillasLibres(mesa) === mesa.sillas.length;
}
