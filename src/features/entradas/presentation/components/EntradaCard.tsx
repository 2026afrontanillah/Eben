import { formatearFechaHora } from '@/shared/format/fecha';
import { buttonClassName } from '@/shared/ui/button-styles';

import { describirUbicacion, type EstadoEntrada, type UbicacionEntrada } from '../../domain/entrada';
import { EntradaQr } from './EntradaQr';
import { EstadoEntradaBadge } from './EstadoEntradaBadge';

export interface EntradaCardData {
  codigo: string;
  estado: EstadoEntrada;
  ubicacion: UbicacionEntrada | null;
  usadaEn: Date | null;
  qrToken: string;
}

interface EntradaCardProps {
  entrada: EntradaCardData;
  eventoNombre: string;
  zonaNombre: string;
  clienteNombre: string;
  pdfHref: string | null;
}

export function EntradaCard({ entrada, eventoNombre, zonaNombre, clienteNombre, pdfHref }: EntradaCardProps) {
  const ubicacion = describirUbicacion(entrada.ubicacion);

  return (
    <article className="flex flex-col rounded-2xl panel p-5 break-words text-ink">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold tracking-widest text-ink-subtle uppercase">Entrada · {zonaNombre}</p>
        <EstadoEntradaBadge estado={entrada.estado} />
      </div>
      <h3 className="mt-1 text-lg font-extrabold text-ink">{eventoNombre}</h3>
      <p className="text-sm text-ink-muted">{clienteNombre}</p>
      {ubicacion ? <p className="mt-1 text-sm font-bold text-ink">{ubicacion}</p> : null}
      <p className="mt-1 text-sm font-extrabold tracking-wide text-ink">{entrada.codigo}</p>

      {entrada.estado === 'ANULADA' ? (
        <div className="my-3 grid h-40 place-items-center rounded-xl bg-surface-raised text-sm text-ink-subtle">
          QR invalidado
        </div>
      ) : (
        <EntradaQr token={entrada.qrToken} codigo={entrada.codigo} />
      )}

      {entrada.usadaEn ? (
        <p className="mb-2 text-center text-xs text-ink-subtle">Ingresó: {formatearFechaHora(entrada.usadaEn)}</p>
      ) : null}

      {pdfHref ? (
        <a href={pdfHref} download className={buttonClassName({ variant: 'secondary', size: 'sm', fullWidth: true })}>
          Descargar esta entrada
        </a>
      ) : null}
    </article>
  );
}
