import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useRouter, Link } from '../router';
import { formatearBolivianos } from '@/shared/format/moneda';
import { formatearFechaHora } from '@/shared/format/fecha';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';

export function VentasListView() {
  const { navigate } = useRouter();
  const [ventas, setVentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const cargarVentas = async (query = '') => {
    setLoading(true);
    try {
      const data = await api.getVentas({ q: query });
      setVentas(data.ventas || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarVentas();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    cargarVentas(search);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Historial de Ventas"
        eyebrow="REGISTRO"
        description="Consulta las ventas realizadas, descarga entradas en PDF o anula comprobantes."
      />

      {/* SEARCH BAR */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Buscar por código de venta, cliente o celular…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-subtle focus:border-brand focus:outline-none"
        />
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      {/* SALES LIST / TABLE */}
      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      ) : ventas.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="text-ink-muted">No se encontraron ventas registradas.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink">
              <thead className="border-b border-line bg-surface-raised text-xs font-bold text-ink-muted uppercase">
                <tr>
                  <th className="px-4 py-3 sm:px-6">Código</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Sector</th>
                  <th className="px-4 py-3 text-center">Cant.</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Pago</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right sm:px-6">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ventas.map((v) => {
                  const anulada = v.estado === 'ANULADA';
                  return (
                    <tr
                      key={v.id}
                      className="transition hover:bg-surface-raised/60"
                    >
                      <td className="px-4 py-3.5 font-mono font-bold sm:px-6">
                        <Link
                          href={`/ventas/${v.id}`}
                          className="text-brand hover:underline"
                        >
                          {v.codigo}
                        </Link>
                        <div className="text-[11px] font-normal text-ink-subtle">
                          {formatearFechaHora(v.creada_en)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold">{v.cliente_nombre}</div>
                        <div className="text-xs text-ink-muted">{v.cliente_celular}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: v.zona_color }}
                          />
                          {v.zona_nombre}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold">{v.cantidad}</td>
                      <td className="px-4 py-3.5 text-right font-extrabold">
                        {formatearBolivianos(v.total_centavos)}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-ink-muted">
                        <span className="rounded bg-surface-strong px-2 py-0.5">
                          {v.metodo_pago || 'Efectivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge tone={anulada ? 'danger' : 'success'}>
                          {anulada ? 'Anulada' : 'Confirmada'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right sm:px-6">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/ventas/${v.id}`)}
                        >
                          Ver detalle
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
