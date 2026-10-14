import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { formatearBolivianos } from '@/shared/format/moneda';
import { PageHeader } from '@/shared/ui/PageHeader';

export function AdminResumenView() {
  const [datos, setDatos] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.getAdminResumen();
        setDatos(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!datos) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 text-center">
        <p className="text-ink-muted">No se pudo cargar el resumen de ventas.</p>
      </div>
    );
  }

  const { totales, porZona, porMetodoPago, porVendedor, eventoNombre } = datos;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Resumen · ${eventoNombre}`}
        eyebrow="PANEL ADMINISTRATIVO"
        description="Métricas consolidadas de ventas, recaudación, métodos de pago y rendimiento del equipo."
      />

      {/* TARJETAS KPI */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-lg">
          <span className="text-xs font-semibold text-ink-muted uppercase">Recaudación total</span>
          <p className="mt-2 text-3xl font-black text-ink">
            {formatearBolivianos(totales.recaudacionTotalCentavos)}
          </p>
          <span className="text-xs text-ink-subtle">Ventas confirmadas</span>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 shadow-lg">
          <span className="text-xs font-semibold text-ink-muted uppercase">Entradas vendidas</span>
          <p className="mt-2 text-3xl font-black text-brand">{totales.entradasVendidas}</p>
          <span className="text-xs text-ink-subtle">Total de cupos emitidos</span>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 shadow-lg">
          <span className="text-xs font-semibold text-ink-muted uppercase">Ingresos en puerta</span>
          <p className="mt-2 text-3xl font-black text-success">{totales.entradasIngresadas}</p>
          <span className="text-xs text-ink-subtle">
            {totales.entradasVendidas > 0
              ? `${Math.round((totales.entradasIngresadas / totales.entradasVendidas) * 100)}% de asistencia`
              : 'Sin ingresos'}
          </span>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 shadow-lg">
          <span className="text-xs font-semibold text-ink-muted uppercase">Operaciones</span>
          <p className="mt-2 text-3xl font-black text-ink">{totales.totalVentas}</p>
          <span className="text-xs text-ink-subtle">Comprobantes emitidos</span>
        </div>
      </div>

      {/* RESUMEN POR ZONA */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-ink">Ventas por Sector</h2>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-lg">
          <table className="w-full text-left text-sm text-ink">
            <thead className="border-b border-line bg-surface-raised text-xs font-bold text-ink-muted uppercase">
              <tr>
                <th className="px-4 py-3 sm:px-6">Sector</th>
                <th className="px-4 py-3 text-center">Capacidad</th>
                <th className="px-4 py-3 text-center">Disponibles</th>
                <th className="px-4 py-3 text-center">Vendidas</th>
                <th className="px-4 py-3 text-right">Recaudado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {porZona.map((z: any) => (
                <tr key={z.zonaId}>
                  <td className="px-4 py-3.5 font-bold sm:px-6">{z.zonaNombre}</td>
                  <td className="px-4 py-3.5 text-center text-ink-muted">{z.capacidad}</td>
                  <td className="px-4 py-3.5 text-center text-ink-muted">{z.disponibles}</td>
                  <td className="px-4 py-3.5 text-center font-bold">{z.entradasVendidas}</td>
                  <td className="px-4 py-3.5 text-right font-extrabold text-brand">
                    {formatearBolivianos(z.recaudadoCentavos)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DOS COLUMNAS: MÉTODOS DE PAGO Y VENDEDORES */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Métodos de Pago */}
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-ink">Métodos de Pago</h2>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-lg">
            <table className="w-full text-left text-sm text-ink">
              <thead className="border-b border-line bg-surface-raised text-xs font-bold text-ink-muted uppercase">
                <tr>
                  <th className="px-4 py-3">Método</th>
                  <th className="px-4 py-3 text-center">Operaciones</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {porMetodoPago.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-ink-muted">
                      Sin pagos registrados
                    </td>
                  </tr>
                ) : (
                  porMetodoPago.map((m: any) => (
                    <tr key={m.metodo}>
                      <td className="px-4 py-3 font-semibold">{m.metodo}</td>
                      <td className="px-4 py-3 text-center">{m.pagos}</td>
                      <td className="px-4 py-3 text-right font-bold">
                        {formatearBolivianos(m.montoCentavos)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vendedores */}
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-ink">Rendimiento por Vendedor</h2>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-lg">
            <table className="w-full text-left text-sm text-ink">
              <thead className="border-b border-line bg-surface-raised text-xs font-bold text-ink-muted uppercase">
                <tr>
                  <th className="px-4 py-3">Vendedor</th>
                  <th className="px-4 py-3 text-center">Entradas</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {porVendedor.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-ink-muted">
                      Sin ventas registradas
                    </td>
                  </tr>
                ) : (
                  porVendedor.map((v: any) => (
                    <tr key={v.vendedorId}>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{v.vendedorNombre}</div>
                        <div className="text-[10px] text-ink-subtle">{v.rol}</div>
                      </td>
                      <td className="px-4 py-3 text-center font-bold">{v.entradas}</td>
                      <td className="px-4 py-3 text-right font-bold text-brand">
                        {formatearBolivianos(v.montoCentavos)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
