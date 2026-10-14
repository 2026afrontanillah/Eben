import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { formatearBolivianos } from '@/shared/format/moneda';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { Alert } from '@/shared/ui/Alert';

export function AdminZonasView() {
  const [zonas, setZonas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [zonaEditando, setZonaEditando] = useState<any | null>(null);
  const [precioBs, setPrecioBs] = useState('');
  const [habilitada, setHabilitada] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargarZonas = async () => {
    try {
      const data = await api.getEventoActivo();
      if (data?.evento?.zonas) {
        setZonas(data.evento.zonas);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar sectores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarZonas();
  }, []);

  const abrirEdicion = (z: any) => {
    setZonaEditando(z);
    setPrecioBs(z.precioCentavos != null ? String(z.precioCentavos / 100) : '');
    setHabilitada(Boolean(z.habilitada));
    setMensaje(null);
    setError(null);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zonaEditando) return;

    setGuardando(true);
    setError(null);
    try {
      const centavos = precioBs.trim() ? Math.round(Number(precioBs) * 100) : null;
      await api.updateZona(zonaEditando.id, {
        precioCentavos: centavos,
        habilitada,
      });
      setMensaje(`Sector "${zonaEditando.nombre}" actualizado.`);
      setZonaEditando(null);
      await cargarZonas();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el sector');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Configuración de Sectores"
        eyebrow="ADMINISTRACIÓN DE PRECIOS"
        description="Ajusta los precios de las entradas y habilita o deshabilita la venta por sector."
      />

      {mensaje && <Alert tone="success">{mensaje}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
          <table className="w-full text-left text-sm text-ink">
            <thead className="border-b border-line bg-surface-raised text-xs font-bold text-ink-muted uppercase">
              <tr>
                <th className="px-4 py-3 sm:px-6">Sector</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 text-center">Capacidad</th>
                <th className="px-4 py-3 text-center">Disponibles</th>
                <th className="px-4 py-3 text-right">Precio unitario</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right sm:px-6">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {zonas.map((z) => (
                <tr key={z.id} className="transition hover:bg-surface-raised/60">
                  <td className="px-4 py-3.5 font-bold sm:px-6">
                    <span className="flex items-center gap-2">
                      <span
                        className="size-3 rounded-full"
                        style={{ backgroundColor: z.color }}
                      />
                      {z.nombre}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-ink-muted">
                    {z.tipo === 'NUMERADA' ? 'Mesas con sillas' : 'Entrada general'}
                  </td>
                  <td className="px-4 py-3.5 text-center">{z.capacidad}</td>
                  <td className="px-4 py-3.5 text-center font-bold">{z.disponibles}</td>
                  <td className="px-4 py-3.5 text-right font-extrabold text-brand">
                    {z.precioCentavos != null
                      ? formatearBolivianos(z.precioCentavos)
                      : <span className="text-warning">Sin configurar</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge tone={z.habilitada ? 'success' : 'neutral'}>
                      {z.habilitada ? 'Habilitado' : 'Deshabilitado'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-right sm:px-6">
                    <Button size="sm" variant="secondary" onClick={() => abrirEdicion(z)}>
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL EDICIÓN ZONA */}
      {zonaEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl">
            <h3 className="text-xl font-black text-ink">Configurar {zonaEditando.nombre}</h3>
            <p className="mt-1 text-xs text-ink-muted">
              Ajusta el precio en bolivianos o cambia la disponibilidad del sector.
            </p>

            <form onSubmit={handleGuardar} className="mt-4 flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-ink">Precio por entrada (Bs)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Ej: 100"
                  value={precioBs}
                  onChange={(e) => setPrecioBs(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-surface-raised px-4 py-2.5 text-sm font-bold text-ink focus:border-brand focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-ink-subtle">
                  Deja vacío si no deseas permitir la venta todavía.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="habilitadaCheckbox"
                  checked={habilitada}
                  onChange={(e) => setHabilitada(e.target.checked)}
                  className="size-4 rounded accent-brand"
                />
                <label htmlFor="habilitadaCheckbox" className="text-sm font-semibold text-ink">
                  Habilitar sector para venta
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setZonaEditando(null)}
                  disabled={guardando}
                >
                  Cancelar
                </Button>
                <Button type="submit" loading={guardando}>
                  Guardar cambios
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
