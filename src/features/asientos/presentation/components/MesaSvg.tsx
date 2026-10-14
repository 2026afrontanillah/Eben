import { estaCompleta, estaLibre, type MesaEstado } from '../../domain/mesa';
import { COLORES_MESA } from './colores-asientos';
import { MESA_VIEWBOX, POSICIONES_SILLAS } from './mesa-geometria';
import { SillaSvg } from './SillaSvg';

interface MesaSvgProps {
  mesa: MesaEstado;
  seleccionadas?: ReadonlySet<number>;
  onAlternarSilla?: (numero: number) => void;
  className?: string;
}

function obtenerColoresMesa(mesa: MesaEstado) {
  if (estaCompleta(mesa)) {
    return COLORES_MESA.completa;
  }
  return estaLibre(mesa) ? COLORES_MESA.libre : COLORES_MESA.parcial;
}

export function MesaSvg({ mesa, seleccionadas, onAlternarSilla, className }: MesaSvgProps) {
  const colores = obtenerColoresMesa(mesa);

  return (
    <svg
      viewBox={`0 0 ${MESA_VIEWBOX.width} ${MESA_VIEWBOX.height}`}
      className={className}
      role={onAlternarSilla ? 'group' : 'img'}
      aria-label={`Mesa ${mesa.numero}`}
    >
      {mesa.sillas.map((silla) => {
        const posicion = POSICIONES_SILLAS[silla.numero - 1];
        return posicion ? (
          <SillaSvg
            key={silla.numero}
            silla={silla}
            posicion={posicion}
            seleccionada={seleccionadas?.has(silla.numero) ?? false}
            onAlternar={onAlternarSilla}
          />
        ) : null;
      })}
      <rect x={17} y={13} width={30} height={72} rx={8} fill={colores.fill} stroke={colores.stroke} strokeWidth={1.4} />
      <text x={32} y={52} textAnchor="middle" fontSize={10} fontWeight={800} fill={colores.texto} pointerEvents="none">
        {mesa.numero}
      </text>
    </svg>
  );
}
