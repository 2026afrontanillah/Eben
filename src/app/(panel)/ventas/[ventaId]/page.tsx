import type { Metadata } from 'next';

import { tienePermiso } from '@/features/auth/domain/permisos';
import { requireUsuario } from '@/features/auth/server/guards';
import { EntradaCard } from '@/features/entradas/presentation/components/EntradaCard';
import { AnularVentaForm } from '@/features/ventas/presentation/components/AnularVentaForm';
import { EstadoVentaBadge } from '@/features/ventas/presentation/components/EstadoVentaBadge';
import { VentaResumenCard } from '@/features/ventas/presentation/components/VentaResumenCard';
import { getContainer } from '@/server/container';
import { formatearFechaHora } from '@/shared/format/fecha';
import { loadOrNotFound } from '@/shared/next/load-or-not-found';
import { Alert } from '@/shared/ui/Alert';
import { buttonClassName } from '@/shared/ui/button-styles';
import { ButtonLink } from '@/shared/ui/ButtonLink';
import { PageHeader } from '@/shared/ui/PageHeader';

export const metadata: Metadata = { title: 'Detalle de venta' };

interface VentaPageProps {
  params: Promise<{ ventaId: string }>;
}

export default async function VentaPage({ params }: VentaPageProps) {
  const usuario = await requireUsuario();
  const { ventaId } = await params;
  const venta = await loadOrNotFound(() => getContainer().consultaVentas.obtenerDetalle(usuario, ventaId));

  const anulada = venta.estado === 'ANULADA';
  const pdfHref = `/api/ventas/${venta.id}/pdf`;
  const titulo = `${venta.cantidad} ${venta.cantidad === 1 ? 'entrada' : 'entradas'} para ${venta.cliente.nombre}`;

  return (
    <div className="grid gap-6">
      <PageHeader
        backHref="/ventas"
        backLabel="Ventas"
        eyebrow={`Venta ${venta.codigo}`}
        title={titulo}
        description={<EstadoVentaBadge estado={venta.estado} />}
        actions={
          anulada ? null : (
            <>
              <a href={pdfHref} download className={buttonClassName()}>
                Descargar todas en PDF
              </a>
              {tienePermiso(usuario.rol, 'VENDER') ? (
                <ButtonLink href={`/eventos/${venta.evento.id}`} variant="secondary">
                  Nueva venta
                </ButtonLink>
              ) : null}
            </>
          )
        }
      />

      {venta.anulacion ? (
        <Alert tone="error" title="Venta anulada">
          Anulada por {venta.anulacion.anuladaPorNombre} el {formatearFechaHora(venta.anulacion.fecha)}. Motivo:{' '}
          {venta.anulacion.motivo}
        </Alert>
      ) : null}

      <VentaResumenCard venta={venta} />

      <section aria-labelledby="entradas-titulo" className="grid gap-3">
        <h2 id="entradas-titulo" className="text-lg font-extrabold text-ink">
          Entradas
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venta.entradas.map((entrada) => (
            <EntradaCard
              key={entrada.id}
              entrada={entrada}
              eventoNombre={venta.evento.nombre}
              zonaNombre={venta.zona.nombre}
              clienteNombre={venta.cliente.nombre}
              pdfHref={anulada || entrada.estado === 'ANULADA' ? null : `${pdfHref}?entradaId=${entrada.id}`}
            />
          ))}
        </div>
      </section>

      {!anulada && tienePermiso(usuario.rol, 'ANULAR_VENTAS') ? <AnularVentaForm ventaId={venta.id} /> : null}
    </div>
  );
}
