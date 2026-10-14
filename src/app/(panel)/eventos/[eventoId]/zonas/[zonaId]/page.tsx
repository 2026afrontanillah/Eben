import type { Metadata } from 'next';

import { requirePermiso } from '@/features/auth/server/guards';
import { obtenerEstadoZona, type EstadoZona, type Zona } from '@/features/eventos/domain/zona';
import { describirDisponibilidad } from '@/features/eventos/presentation/components/disponibilidad-zona';
import { calcularCantidadMaxima } from '@/features/ventas/domain/reglas-venta';
import { VentaAsientosPanel } from '@/features/ventas/presentation/components/VentaAsientosPanel';
import { VentaGeneralForm } from '@/features/ventas/presentation/components/VentaGeneralForm';
import { getContainer } from '@/server/container';
import { formatearBolivianos } from '@/shared/format/moneda';
import { loadOrNotFound } from '@/shared/next/load-or-not-found';
import { Alert } from '@/shared/ui/Alert';
import { AutoRefresh } from '@/shared/ui/AutoRefresh';
import { Card } from '@/shared/ui/Card';
import { PageHeader } from '@/shared/ui/PageHeader';

export const metadata: Metadata = { title: 'Vender zona' };

const INTERVALO_ACTUALIZACION_MS = 10_000;
const MESAS_POR_FILA_POR_DEFECTO = 10;

const MOTIVO_NO_VENDIBLE: Record<Exclude<EstadoZona, 'A_LA_VENTA'>, string> = {
  AGOTADA: 'Esta zona está agotada.',
  SIN_PRECIO: 'Esta zona todavía no tiene precio. Un administrador debe configurarlo en Zonas.',
  NO_HABILITADA: 'Esta zona no está habilitada para la venta.',
};

interface ZonaPageProps {
  params: Promise<{ eventoId: string; zonaId: string }>;
}

async function ZonaVenta({ eventoId, zona }: { eventoId: string; zona: Zona & { precioCentavos: number } }) {
  if (zona.tipo === 'GENERAL') {
    return (
      <Card className="max-w-2xl">
        <VentaGeneralForm
          eventoId={eventoId}
          zonaId={zona.id}
          precioUnitarioCentavos={zona.precioCentavos}
          cantidadMaxima={calcularCantidadMaxima(zona.disponibles)}
        />
      </Card>
    );
  }

  const mesas = await getContainer().asientosService.obtenerMesas(zona.id);
  return (
    <VentaAsientosPanel
      eventoId={eventoId}
      zonaId={zona.id}
      zonaNombre={zona.nombre}
      precioUnitarioCentavos={zona.precioCentavos}
      mesasPorFila={zona.distribucion?.mesasPorFila ?? MESAS_POR_FILA_POR_DEFECTO}
      mesas={mesas}
    />
  );
}

export default async function ZonaPage({ params }: ZonaPageProps) {
  await requirePermiso('VENDER');
  const { eventoId, zonaId } = await params;
  const { evento, zona } = await loadOrNotFound(() => getContainer().eventosService.obtenerZona(eventoId, zonaId));

  const estado = obtenerEstadoZona(zona);
  const precio = zona.precioCentavos === null ? 'Sin precio' : `${formatearBolivianos(zona.precioCentavos)} por entrada`;

  return (
    <>
      <AutoRefresh intervalMs={INTERVALO_ACTUALIZACION_MS} />
      <PageHeader
        backHref={`/eventos/${evento.id}`}
        backLabel="Volver al mapa"
        eyebrow={evento.nombre}
        title={zona.nombre}
        description={`${precio} · ${describirDisponibilidad(zona)}`}
      />
      {estado === 'A_LA_VENTA' && zona.precioCentavos !== null ? (
        <ZonaVenta eventoId={evento.id} zona={{ ...zona, precioCentavos: zona.precioCentavos }} />
      ) : (
        <Alert tone="warning" title="No disponible para la venta">
          {MOTIVO_NO_VENDIBLE[estado === 'A_LA_VENTA' ? 'SIN_PRECIO' : estado]}
        </Alert>
      )}
    </>
  );
}
