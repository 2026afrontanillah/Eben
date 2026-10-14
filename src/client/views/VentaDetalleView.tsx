import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useRouter } from '../router';
import { useAuth } from '../AuthContext';
import { EntradaQr } from '@/features/entradas/presentation/components/EntradaQr';
import { formatearBolivianos } from '@/shared/format/moneda';
import { formatearFechaHora } from '@/shared/format/fecha';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Alert } from '@/shared/ui/Alert';

interface VentaDetalleViewProps {
  ventaId: string;
}

export function VentaDetalleView({ ventaId }: VentaDetalleViewProps) {
  const { navigate } = useRouter();
  const { hasPermiso } = useAuth();
  const [venta, setVenta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal para anulación
  const [modalAnular, setModalAnular] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [anulando, setAnulando] = useState(false);
  const [errorAnular, setErrorAnular] = useState<string | null>(null);

  const cargarVenta = async () => {
    try {
      const data = await api.getVenta(ventaId);
      setVenta(data.venta);
    } catch (err: any) {
      setError(err.message || 'Error al cargar la venta');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarVenta();
  }, [ventaId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!venta) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 text-center">
        <h2 className="text-xl font-bold text-ink">Venta no encontrada</h2>
        <Button className="mt-4" onClick={() => navigate('/ventas')}>
          Volver a ventas
        </Button>
      </div>
    );
  }

  const anulada = venta.estado === 'ANULADA';

  const handleAnular = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim() || motivo.trim().length < 5) {
      setErrorAnular('Indica un motivo de al menos 5 caracteres');
      return;
    }

    setAnulando(true);
    setErrorAnular(null);
    try {
      await api.anularVenta(venta.id, motivo.trim());
      setModalAnular(false);
      cargarVenta();
    } catch (err: any) {
      setErrorAnular(err.message || 'Error al anular la venta');
    } finally {
      setAnulando(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Venta ${venta.codigo}`}
        eyebrow="DETALLE DEL COMPROBANTE"
        description={`${formatearFechaHora(venta.creadaEn)} · Registrada por ${venta.vendedorNombre}`}
        backHref="/ventas"
        backLabel="Volver a ventas"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {!anulada && (
              <a
                href={`/api/ventas/${venta.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-brand-ink transition hover:bg-neutral-200"
              >
                Descargar entradas (PDF)
              </a>
            )}

            {!anulada && hasPermiso('ANULAR_VENTAS') && (
              <Button variant="danger" onClick={() => setModalAnular(true)}>
                Anular venta
              </Button>
            )}
          </div>
        }
      />

      {error && <Alert tone="error">{error}</Alert>}

      {anulada && (
        <Alert tone="error">
          <p className="font-bold">Esta venta fue anulada el {formatearFechaHora(venta.anuladaEn)}.</p>
          <p className="text-xs">
            Por: {venta.anuladaPor || 'Administrador'} · Motivo: &ldquo;{venta.motivoAnulacion}&rdquo;
          </p>
          <p className="mt-1 text-xs">Las entradas y asientos asociados quedaron invalidados.</p>
        </Alert>
      )}

      {/* RESUMEN DE LA VENTA */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-line bg-surface p-4">
          <span className="text-xs font-semibold text-ink-muted">Sector</span>
          <p className="mt-1 text-lg font-bold text-ink">{venta.zonaNombre}</p>
          <p className="text-xs text-ink-subtle">
            {formatearBolivianos(venta.precioUnitarioCentavos)} c/u
          </p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4">
          <span className="text-xs font-semibold text-ink-muted">Cliente</span>
          <p className="mt-1 text-lg font-bold text-ink">{venta.cliente.nombre}</p>
          <p className="text-xs text-ink-subtle">{venta.cliente.celular}</p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4">
          <span className="text-xs font-semibold text-ink-muted">Pago registrado</span>
          <p className="mt-1 text-lg font-bold text-ink">
            {venta.pagos[0]?.metodo || 'Efectivo'}
          </p>
          {venta.pagos[0]?.referencia && (
            <p className="text-xs text-ink-subtle">Ref: {venta.pagos[0].referencia}</p>
          )}
        </div>

        <div className="rounded-xl border border-line bg-surface p-4">
          <span className="text-xs font-semibold text-ink-muted">Total abonado</span>
          <p className="mt-1 text-2xl font-black text-ink">
            {formatearBolivianos(venta.totalCentavos)}
          </p>
          <p className="text-xs text-ink-subtle">{venta.cantidad} entrada(s)</p>
        </div>
      </div>

      {/* ENTRADAS GENERADAS CON QR */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-ink">
          Entradas emitidas ({venta.entradas.length})
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venta.entradas.map((entrada: any) => {
            const estadoBadgeTone =
              entrada.estado === 'VALIDA'
                ? 'success'
                : entrada.estado === 'USADA'
                ? 'warning'
                : 'danger';

            return (
              <div
                key={entrada.id}
                className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-5 shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-ink-muted">
                      {entrada.codigo}
                    </span>
                    <Badge tone={estadoBadgeTone}>{entrada.estado}</Badge>
                  </div>

                  {entrada.ubicacion && (
                    <p className="mt-2 text-base font-extrabold text-brand">
                      {entrada.ubicacion}
                    </p>
                  )}

                  {/* QR SVG */}
                  {!anulada && (
                    <div className="my-3 flex justify-center rounded-xl bg-white p-2">
                      <EntradaQr token={entrada.qrToken} codigo={entrada.codigo} />
                    </div>
                  )}

                  {entrada.estado === 'USADA' && (
                    <p className="text-center text-xs text-warning">
                      Ingreso registrado el {formatearFechaHora(entrada.usadaEn)}
                    </p>
                  )}
                </div>

                {!anulada && (
                  <div className="mt-4 border-t border-line pt-3 text-center">
                    <a
                      href={`/api/ventas/${venta.id}/pdf?entradaId=${entrada.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-brand hover:underline"
                    >
                      Descargar este PDF individual
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DE ANULACIÓN */}
      {modalAnular && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-danger">Anular venta {venta.codigo}</h3>
            <p className="mt-1 text-xs text-ink-muted">
              Esta acción es irreversible. Se liberará el stock y los asientos asignados, y los
              códigos QR serán rechazados en puerta.
            </p>

            <form onSubmit={handleAnular} className="mt-4 flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-ink">
                  Motivo de anulación (obligatorio)
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ej: Error en el monto, cliente canceló la compra…"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-surface-raised p-3 text-sm text-ink placeholder:text-ink-subtle focus:border-danger focus:outline-none"
                />
              </div>

              {errorAnular && <Alert tone="error">{errorAnular}</Alert>}

              <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setModalAnular(false)}
                  disabled={anulando}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="danger" loading={anulando}>
                  Confirmar anulación
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
