import type { Metadata } from 'next';

import { requirePermiso } from '@/features/auth/server/guards';
import { ConfigurarZonaForm } from '@/features/eventos/presentation/components/ConfigurarZonaForm';
import { describirDisponibilidad } from '@/features/eventos/presentation/components/disponibilidad-zona';
import { getContainer } from '@/server/container';
import { Card } from '@/shared/ui/Card';
import { EmptyState } from '@/shared/ui/EmptyState';
import { PageHeader } from '@/shared/ui/PageHeader';

export const metadata: Metadata = { title: 'Zonas' };

export default async function ZonasPage() {
  await requirePermiso('CONFIGURAR_ZONAS');
  const { eventosService } = getContainer();
  const evento = await eventosService.obtenerEventoActivo();

  if (!evento) {
    return <EmptyState title="No hay eventos activos" />;
  }

  const { zonas } = await eventosService.obtenerMapa(evento.id);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={evento.nombre}
        title="Zonas y precios"
        description="Una zona sin precio o deshabilitada no se puede vender. Los cambios de precio aplican a las ventas nuevas."
      />
      {zonas.map((zona) => (
        <Card key={zona.id} aria-label={zona.nombre}>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-extrabold text-ink">{zona.nombre}</h2>
            <p className="text-sm text-ink-muted">
              {zona.tipo === 'NUMERADA' ? 'Mesas numeradas' : 'Entrada general'} · {describirDisponibilidad(zona)}
            </p>
          </div>
          <ConfigurarZonaForm zona={zona} />
        </Card>
      ))}
    </div>
  );
}
