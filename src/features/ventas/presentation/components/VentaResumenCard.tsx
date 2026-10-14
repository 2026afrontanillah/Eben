import type { ReactNode } from 'react';

import { formatearFechaHora } from '@/shared/format/fecha';
import { formatearBolivianos } from '@/shared/format/moneda';
import { Card } from '@/shared/ui/Card';

import { ETIQUETAS_METODO_PAGO } from '../../domain/metodo-pago';
import type { VentaDetalle } from '../../domain/venta';

function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-ink-subtle uppercase">{etiqueta}</dt>
      <dd className="mt-0.5 font-semibold break-words text-ink">{children}</dd>
    </div>
  );
}

interface VentaResumenCardProps {
  venta: Pick<
    VentaDetalle,
    'cliente' | 'zona' | 'cantidad' | 'precioUnitarioCentavos' | 'totalCentavos' | 'vendedor' | 'creadaEn' | 'pagos'
  >;
}

export function VentaResumenCard({ venta }: VentaResumenCardProps) {
  return (
    <Card aria-label="Resumen de la venta">
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Dato etiqueta="Cliente">{venta.cliente.nombre}</Dato>
        <Dato etiqueta="Celular">{venta.cliente.celular}</Dato>
        <Dato etiqueta="Email">{venta.cliente.email ?? '—'}</Dato>
        <Dato etiqueta="Zona">{venta.zona.nombre}</Dato>
        <Dato etiqueta="Entradas">
          {venta.cantidad} × {formatearBolivianos(venta.precioUnitarioCentavos)}
        </Dato>
        <Dato etiqueta="Total">{formatearBolivianos(venta.totalCentavos)}</Dato>
        {venta.pagos.map((pago) => (
          <Dato key={pago.registradoEn.toISOString()} etiqueta="Pago">
            {ETIQUETAS_METODO_PAGO[pago.metodo]} · {formatearBolivianos(pago.montoCentavos)}
            {pago.referencia ? ` · Ref. ${pago.referencia}` : ''}
          </Dato>
        ))}
        <Dato etiqueta="Vendedor">{venta.vendedor.nombre}</Dato>
        <Dato etiqueta="Fecha">{formatearFechaHora(venta.creadaEn)}</Dato>
      </dl>
    </Card>
  );
}
