import type { KeyboardEvent } from 'react';

import type { SillaEstado } from '../../domain/mesa';
import { COLORES_SILLA } from './colores-asientos';
import type { PosicionSilla } from './mesa-geometria';

interface SillaSvgProps {
  silla: SillaEstado;
  posicion: PosicionSilla;
  seleccionada: boolean;
  onAlternar?: (numero: number) => void;
}

function obtenerColores(silla: SillaEstado, seleccionada: boolean) {
  if (silla.vendida) {
    return COLORES_SILLA.vendida;
  }
  return seleccionada ? COLORES_SILLA.seleccionada : COLORES_SILLA.disponible;
}

function obtenerMarca(silla: SillaEstado, seleccionada: boolean): string {
  if (silla.vendida) {
    return '×';
  }
  return seleccionada ? '✓' : String(silla.numero);
}

export function SillaSvg({ silla, posicion, seleccionada, onAlternar }: SillaSvgProps) {
  const colores = obtenerColores(silla, seleccionada);
  const rect = (
    <rect
      x={posicion.x}
      y={posicion.y}
      width={posicion.width}
      height={posicion.height}
      rx={3}
      fill={colores.fill}
      stroke={colores.stroke}
      strokeWidth={1}
    />
  );

  if (!onAlternar) {
    return rect;
  }

  const alternar = () => {
    if (!silla.vendida) {
      onAlternar(silla.numero);
    }
  };
  const onKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      alternar();
    }
  };

  return (
    <g
      role="button"
      tabIndex={silla.vendida ? -1 : 0}
      aria-label={`Silla ${silla.numero}${silla.vendida ? ', vendida' : ''}`}
      aria-pressed={seleccionada}
      aria-disabled={silla.vendida}
      onClick={alternar}
      onKeyDown={onKeyDown}
      className={
        silla.vendida
          ? 'cursor-not-allowed opacity-60'
          : 'cursor-pointer transition hover:brightness-125 focus:outline-none focus-visible:brightness-125'
      }
    >
      {rect}
      <text
        x={posicion.x + posicion.width / 2}
        y={posicion.y + posicion.height / 2 + 2.5}
        textAnchor="middle"
        fontSize={seleccionada ? 8 : 6}
        fontWeight={800}
        fill={colores.texto}
        pointerEvents="none"
      >
        {obtenerMarca(silla, seleccionada)}
      </text>
    </g>
  );
}
