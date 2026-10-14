import { Badge, type BadgeTone } from '@/shared/ui/Badge';

import { ETIQUETAS_ESTADO_ENTRADA, type EstadoEntrada } from '../../domain/entrada';

const TONO_POR_ESTADO: Record<EstadoEntrada, BadgeTone> = {
  VALIDA: 'success',
  USADA: 'inverse',
  ANULADA: 'danger',
};

export function EstadoEntradaBadge({ estado }: { estado: EstadoEntrada }) {
  return <Badge tone={TONO_POR_ESTADO[estado]}>{ETIQUETAS_ESTADO_ENTRADA[estado]}</Badge>;
}
