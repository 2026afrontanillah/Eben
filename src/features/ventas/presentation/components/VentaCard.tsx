import Link from 'next/link';

import { formatearFechaHora } from '@/shared/format/fecha';
import { formatearBolivianos } from '@/shared/format/moneda';

import { ETIQUETAS_METODO_PAGO } from '../../domain/metodo-pago';
import type { VentaResumen } from '../../domain/venta';
import { EstadoVentaBadge } from './EstadoVentaBadge';

interface VentaCardProps {
  venta: VentaResumen;
  mostrarVendedor: boolean;
}

export function VentaCard({ venta, mostrarVendedor }: VentaCardProps) {
  return (
    <Link
      href={`/ventas/${venta.id}`}
      className="flex flex-col gap-3 rounded-2xl panel p-4 hover:border-ink-subtle focus-visible:outline-3 focus-visible:outline-focus"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-extrabold text-ink">{venta.cliente.nombre}</p>
          <p className="text-sm text-ink-muted">{venta.cliente.celular}</p>
        </div>
        <EstadoVentaBadge estado={venta.estado} />
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm text-ink-muted">
        <span>
          {venta.zonaNombre} · {venta.cantidad} {venta.cantidad === 1 ? 'entrada' : 'entradas'}
        </span>
        <strong className="text-base text-ink">{formatearBolivianos(venta.totalCentavos)}</strong>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-subtle">
        <span>{venta.codigo}</span>
        <span>{formatearFechaHora(venta.creadaEn)}</span>
        {venta.metodoPago ? <span>{ETIQUETAS_METODO_PAGO[venta.metodoPago]}</span> : null}
        {mostrarVendedor ? <span>Vendió: {venta.vendedorNombre}</span> : null}
      </div>
    </Link>
  );
}
