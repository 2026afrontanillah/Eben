import type { Evento } from '../../domain/evento';
import type { Zona } from '../../domain/zona';
import { ZonaTile } from './ZonaTile';

interface EventoMapaProps {
  evento: Evento;
  zonas: readonly Zona[];
}

export function EventoMapa({ evento, zonas }: EventoMapaProps) {
  return (
    <section aria-label="Mapa de sectores" className="panel rounded-3xl p-3 shadow-2xl shadow-black/50 sm:p-5">
      <div className="rounded-lg bg-brand py-3.5 text-center text-xs font-black tracking-[0.35em] text-brand-ink sm:text-sm">
        ESCENARIO
      </div>
      <div
        className="mt-3 grid gap-2 sm:mt-4 sm:gap-3"
        style={{ gridTemplateColumns: evento.plano.columnas, gridTemplateRows: evento.plano.filas }}
      >
        {zonas.map((zona) => (
          <ZonaTile key={zona.id} zona={zona} href={`/eventos/${evento.id}/zonas/${zona.id}`} />
        ))}
      </div>
    </section>
  );
}
