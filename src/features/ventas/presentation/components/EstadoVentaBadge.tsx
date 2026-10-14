import { Badge } from '@/shared/ui/Badge';

import type { EstadoVenta } from '../../domain/venta';

export function EstadoVentaBadge({ estado }: { estado: EstadoVenta }) {
  return estado === 'CONFIRMADA' ? <Badge tone="success">Confirmada</Badge> : <Badge tone="danger">Anulada</Badge>;
}
