import Link from 'next/link';
import type { CSSProperties } from 'react';

import { cn } from '@/shared/ui/cn';

import { obtenerEstadoZona, type Zona } from '../../domain/zona';
import { describirDisponibilidad, describirDisponibilidadCorta } from './disponibilidad-zona';
import { construirFondoZona } from './zona-colores';

interface ZonaTileProps {
  zona: Zona;
  href: string;
}

const TILE_CLASS =
  'flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl p-1.5 text-center text-white ' +
  'ring-1 ring-white/10 ring-inset [text-shadow:0_1px_3px_rgb(0_0_0/0.55)]';

export function ZonaTile({ zona, href }: ZonaTileProps) {
  const disponibilidad = describirDisponibilidad(zona);
  const style = {
    gridArea: zona.areaPlano,
    background: construirFondoZona(zona),
    '--zona-color': zona.color,
  } as CSSProperties;

  const contenido = (
    <>
      <span className="text-[11px] leading-tight font-black tracking-wide break-words uppercase sm:text-base">
        {zona.nombre}
      </span>
      <span className="max-w-full rounded-full bg-black/55 px-1.5 py-1 text-[10px] leading-tight font-semibold sm:px-2.5 sm:text-xs">
        <span className="sm:hidden">{describirDisponibilidadCorta(zona)}</span>
        <span className="hidden sm:inline">{disponibilidad}</span>
      </span>
    </>
  );

  if (obtenerEstadoZona(zona) !== 'A_LA_VENTA') {
    return (
      <div style={style} className={cn(TILE_CLASS, 'cursor-not-allowed opacity-60 saturate-50')} aria-disabled="true">
        {contenido}
      </div>
    );
  }

  return (
    <Link
      href={href}
      style={style}
      aria-label={`${zona.nombre}: ${disponibilidad}. Vender entradas`}
      className={cn(
        TILE_CLASS,
        'transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_32px_-6px_var(--zona-color)] hover:brightness-110',
        'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus',
      )}
    >
      {contenido}
    </Link>
  );
}
