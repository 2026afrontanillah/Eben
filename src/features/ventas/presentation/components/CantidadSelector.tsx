'use client';

import { useId } from 'react';

import { FIELD_CONTROL_CLASS, FIELD_LABEL_CLASS } from '@/shared/ui/field-styles';

interface CantidadSelectorProps {
  value: number;
  max: number;
  onChange: (cantidad: number) => void;
  error?: string;
}

const STEP_BUTTON_CLASS =
  'size-12 shrink-0 rounded-xl border border-line-strong bg-surface-raised text-2xl text-ink hover:bg-surface-strong disabled:opacity-40';

export function CantidadSelector({ value, max, onChange, error }: CantidadSelectorProps) {
  const selectId = useId();
  const opciones = Array.from({ length: max }, (_, indice) => indice + 1);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className={FIELD_LABEL_CLASS}>
        Cantidad de entradas
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={STEP_BUTTON_CLASS}
          aria-label="Reducir cantidad"
          disabled={value <= 1}
          onClick={() => onChange(value - 1)}
        >
          −
        </button>
        <select
          id={selectId}
          name="cantidad"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className={`${FIELD_CONTROL_CLASS} text-center text-lg font-bold`}
        >
          {opciones.map((opcion) => (
            <option key={opcion} value={opcion}>
              {opcion}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={STEP_BUTTON_CLASS}
          aria-label="Aumentar cantidad"
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
        >
          +
        </button>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
