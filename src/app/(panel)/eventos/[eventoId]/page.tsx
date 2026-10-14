import type { Metadata } from 'next';

import { requirePermiso } from '@/features/auth/server/guards';
import { EventoMapa } from '@/features/eventos/presentation/components/EventoMapa';
import { ZonasLista } from '@/features/eventos/presentation/components/ZonasLista';
import { getContainer } from '@/server/container';
import { loadOrNotFound } from '@/shared/next/load-or-not-found';
import { AutoRefresh } from '@/shared/ui/AutoRefresh';
import { PageHeader } from '@/shared/ui/PageHeader';

export const metadata: Metadata = { title: 'Vender' };

const INTERVALO_ACTUALIZACION_MS = 10_000;

interface EventoPageProps {
  params: Promise<{ eventoId: string }>;
}

export default async function EventoPage({ params }: EventoPageProps) {
  await requirePermiso('VENDER');
  const { eventoId } = await params;
  const { evento, zonas } = await loadOrNotFound(() => getContainer().eventosService.obtenerMapa(eventoId));

  return (
    <>
      <AutoRefresh intervalMs={INTERVALO_ACTUALIZACION_MS} />
      <PageHeader
        eyebrow="Venta de entradas"
        title={evento.nombre}
        description="Elige una zona para vender. La disponibilidad se actualiza sola."
      />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <EventoMapa evento={evento} zonas={zonas} />
        <section aria-labelledby="zonas-titulo" className="grid gap-3">
          <h2 id="zonas-titulo" className="text-lg font-extrabold text-ink">
            Zonas y precios
          </h2>
          <ZonasLista eventoId={evento.id} zonas={zonas} />
        </section>
      </div>
    </>
  );
}
