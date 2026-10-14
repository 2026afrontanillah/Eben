import type { Metadata } from 'next';

import { requirePermiso } from '@/features/auth/server/guards';
import { ResumenMetodosPagoTable } from '@/features/reportes/presentation/components/ResumenMetodosPagoTable';
import { ResumenTotales } from '@/features/reportes/presentation/components/ResumenTotales';
import { ResumenVendedoresTable } from '@/features/reportes/presentation/components/ResumenVendedoresTable';
import { ResumenZonasTable } from '@/features/reportes/presentation/components/ResumenZonasTable';
import { getContainer } from '@/server/container';
import { AutoRefresh } from '@/shared/ui/AutoRefresh';
import { EmptyState } from '@/shared/ui/EmptyState';
import { PageHeader } from '@/shared/ui/PageHeader';

export const metadata: Metadata = { title: 'Resumen de ventas' };

const INTERVALO_ACTUALIZACION_MS = 30_000;

export default async function ResumenPage() {
  await requirePermiso('VER_RESUMEN');
  const container = getContainer();
  const evento = await container.eventosService.obtenerEventoActivo();

  if (!evento) {
    return <EmptyState title="No hay eventos activos" />;
  }

  const resumen = await container.obtenerResumenVentas.ejecutar(evento.id);

  return (
    <div className="grid gap-6">
      <AutoRefresh intervalMs={INTERVALO_ACTUALIZACION_MS} />
      <PageHeader
        eyebrow={evento.nombre}
        title="Resumen de ventas"
        description="Solo cuenta ventas confirmadas; las anuladas no suman."
      />
      <ResumenTotales totales={resumen.totales} />
      <ResumenZonasTable zonas={resumen.porZona} />
      <div className="grid gap-6 lg:grid-cols-2">
        <ResumenMetodosPagoTable metodos={resumen.porMetodoPago} />
        <ResumenVendedoresTable vendedores={resumen.porVendedor} />
      </div>
    </div>
  );
}
