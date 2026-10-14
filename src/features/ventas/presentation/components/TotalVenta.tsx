import { formatearBolivianos } from '@/shared/format/moneda';

import { calcularTotalCentavos } from '../../domain/reglas-venta';

interface TotalVentaProps {
  cantidad: number;
  precioUnitarioCentavos: number;
}

export function TotalVenta({ cantidad, precioUnitarioCentavos }: TotalVentaProps) {
  const etiquetaCantidad = cantidad === 1 ? '1 entrada' : `${cantidad} entradas`;

  return (
    <div
      aria-live="polite"
      className="flex items-center justify-between gap-3 rounded-xl border border-line-strong bg-surface-raised px-4 py-3 text-ink"
    >
      <span className="text-sm">
        {etiquetaCantidad} × {formatearBolivianos(precioUnitarioCentavos)}
      </span>
      <strong className="text-xl font-extrabold text-brand">
        {formatearBolivianos(calcularTotalCentavos(precioUnitarioCentavos, cantidad))}
      </strong>
    </div>
  );
}
