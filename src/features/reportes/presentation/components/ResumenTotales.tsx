import { formatearBolivianos } from '@/shared/format/moneda';

import type { TotalesVentas } from '../../domain/resumen-ventas';

export function ResumenTotales({ totales }: { totales: TotalesVentas }) {
  const indicadores = [
    { etiqueta: 'Recaudado', valor: formatearBolivianos(totales.recaudadoCentavos) },
    { etiqueta: 'Entradas vendidas', valor: totales.entradas.toLocaleString('es-BO') },
    { etiqueta: 'Ventas', valor: totales.ventas.toLocaleString('es-BO') },
    { etiqueta: 'Ingresaron', valor: totales.ingresados.toLocaleString('es-BO') },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {indicadores.map((indicador) => (
        <div key={indicador.etiqueta} className="rounded-2xl panel p-4">
          <dt className="text-xs font-bold tracking-wide text-ink-subtle uppercase">{indicador.etiqueta}</dt>
          <dd className="mt-1 text-2xl font-extrabold text-ink tabular-nums">{indicador.valor}</dd>
        </div>
      ))}
    </dl>
  );
}
