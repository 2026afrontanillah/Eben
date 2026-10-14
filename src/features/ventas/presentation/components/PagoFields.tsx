'use client';

import { useState } from 'react';

import { getFieldError, type ActionResult } from '@/shared/actions/action-result';
import { TextField } from '@/shared/ui/TextField';

import { ETIQUETAS_METODO_PAGO, METODOS_PAGO, requiereReferencia, type MetodoPago } from '../../domain/metodo-pago';

interface PagoFieldsProps {
  state: ActionResult<unknown> | null;
}

export function PagoFields({ state }: PagoFieldsProps) {
  const [metodo, setMetodo] = useState<MetodoPago>('EFECTIVO');
  const exigeReferencia = requiereReferencia(metodo);
  const errorMetodo = getFieldError(state, 'metodoPago');

  return (
    <fieldset className="grid gap-4">
      <legend className="mb-1 text-base font-extrabold text-ink">Pago recibido</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {METODOS_PAGO.map((opcion) => (
          <label
            key={opcion}
            className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-line bg-surface-raised px-3 text-center text-sm font-bold text-ink has-checked:border-brand has-checked:bg-brand/10 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus"
          >
            <input
              type="radio"
              name="metodoPago"
              value={opcion}
              checked={metodo === opcion}
              onChange={() => setMetodo(opcion)}
              className="sr-only"
            />
            {ETIQUETAS_METODO_PAGO[opcion]}
          </label>
        ))}
      </div>
      {errorMetodo ? <p className="text-sm text-danger">{errorMetodo}</p> : null}
      <TextField
        label={exigeReferencia ? 'N.º de comprobante' : 'Referencia (opcional)'}
        name="referenciaPago"
        autoComplete="off"
        maxLength={100}
        required={exigeReferencia}
        hint={exigeReferencia ? 'Obligatorio para pagos por QR o transferencia.' : undefined}
        error={getFieldError(state, 'referenciaPago')}
      />
    </fieldset>
  );
}
