import Link from 'next/link';

import { formatearBolivianos } from '@/shared/format/moneda';
import { Badge } from '@/shared/ui/Badge';

import { obtenerEstadoZona, type Zona } from '../../domain/zona';
import { describirDisponibilidad } from './disponibilidad-zona';

interface ZonasListaProps {
  eventoId: string;
  zonas: readonly Zona[];
}

export function ZonasLista({ eventoId, zonas }: ZonasListaProps) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
      {zonas.map((zona) => {
        const aLaVenta = obtenerEstadoZona(zona) === 'A_LA_VENTA';
        return (
          <li key={zona.id}>
            <Link
              href={`/eventos/${eventoId}/zonas/${zona.id}`}
              aria-disabled={!aLaVenta}
              tabIndex={aLaVenta ? undefined : -1}
              style={{ borderLeftColor: zona.color }}
              className="panel flex min-h-16 items-center justify-between gap-3 rounded-2xl border-l-4 px-4 py-3 hover:border-ink-subtle aria-disabled:pointer-events-none aria-disabled:opacity-60"
            >
              <span className="flex items-center gap-3">
                <span aria-hidden="true" className="size-4 rounded ring-1 ring-white/20" style={{ background: zona.color }} />
                <span>
                  <span className="block font-bold text-ink">{zona.nombre}</span>
                  <span className="text-sm text-ink-muted">{describirDisponibilidad(zona)}</span>
                </span>
              </span>
              <Badge tone={aLaVenta ? 'success' : 'neutral'}>
                {zona.precioCentavos === null ? 'Sin precio' : formatearBolivianos(zona.precioCentavos)}
              </Badge>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
