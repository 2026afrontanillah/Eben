import type { ActionResult } from '@/shared/actions/action-result';
import { formatearFechaHora } from '@/shared/format/fecha';
import { cn } from '@/shared/ui/cn';

import type { EntradaControl, ResultadoValidacion } from '../../domain/control-acceso';
import { describirUbicacion } from '../../domain/entrada';

interface Veredicto {
  titulo: string;
  detalle: string;
  tono: 'exito' | 'rechazo' | 'aviso';
  entrada: EntradaControl | null;
}

const TONO_CLASS: Record<Veredicto['tono'], string> = {
  exito: 'border-success bg-green-950/80 text-green-100',
  rechazo: 'border-danger bg-red-950/80 text-red-100',
  aviso: 'border-warning bg-amber-950/80 text-amber-100',
};

function construirVeredicto(resultado: ResultadoValidacion): Veredicto {
  switch (resultado.tipo) {
    case 'ADMITIDA':
      return { titulo: '✓ Adelante', detalle: 'Entrada válida. Ingreso registrado.', tono: 'exito', entrada: resultado.entrada };
    case 'YA_USADA':
      return {
        titulo: '✕ Ya ingresó',
        detalle: resultado.entrada.usadaEn
          ? `Esta entrada se usó el ${formatearFechaHora(resultado.entrada.usadaEn)}`
          : 'Esta entrada ya fue usada.',
        tono: 'rechazo',
        entrada: resultado.entrada,
      };
    case 'ANULADA':
      return { titulo: '✕ Entrada anulada', detalle: 'La venta fue anulada. No permitir el ingreso.', tono: 'rechazo', entrada: resultado.entrada };
    case 'QR_INVALIDO':
      return { titulo: '✕ QR no válido', detalle: 'La firma del QR no coincide: posible entrada falsificada.', tono: 'rechazo', entrada: null };
    case 'NO_ENCONTRADA':
      return { titulo: 'No encontrada', detalle: 'No existe una entrada con ese código. Revisa que esté bien escrito.', tono: 'aviso', entrada: null };
  }
}

interface ResultadoValidacionCardProps {
  state: ActionResult<ResultadoValidacion> | null;
}

export function ResultadoValidacionCard({ state }: ResultadoValidacionCardProps) {
  if (!state) {
    return null;
  }

  if (!state.ok) {
    return (
      <div role="alert" className={cn('rounded-2xl border-2 p-5', TONO_CLASS.aviso)}>
        {state.error}
      </div>
    );
  }

  const veredicto = construirVeredicto(state.data);
  const ubicacion = veredicto.entrada ? describirUbicacion(veredicto.entrada.ubicacion) : null;

  return (
    <div role="alert" className={cn('rounded-2xl border-2 p-5 sm:p-6', TONO_CLASS[veredicto.tono])}>
      <p className="text-3xl font-extrabold tracking-tight uppercase sm:text-4xl">{veredicto.titulo}</p>
      <p className="mt-2 font-semibold">{veredicto.detalle}</p>
      {veredicto.entrada ? (
        <dl className="mt-4 grid gap-1 text-sm">
          <div>
            <dt className="inline font-bold">Zona: </dt>
            <dd className="inline">
              {veredicto.entrada.zonaNombre}
              {ubicacion ? ` · ${ubicacion}` : ''}
            </dd>
          </div>
          <div>
            <dt className="inline font-bold">Cliente: </dt>
            <dd className="inline">{veredicto.entrada.clienteNombre}</dd>
          </div>
          <div>
            <dt className="inline font-bold">Código: </dt>
            <dd className="inline">{veredicto.entrada.codigo}</dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}
