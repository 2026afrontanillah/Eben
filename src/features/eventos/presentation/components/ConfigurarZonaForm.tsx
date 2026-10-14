'use client';

import { getFieldError } from '@/shared/actions/action-result';
import { centavosABolivianos } from '@/shared/format/moneda';
import { useFormAction } from '@/shared/hooks/use-form-action';
import { Button } from '@/shared/ui/Button';
import { TextField } from '@/shared/ui/TextField';

import type { Zona } from '../../domain/zona';
import { configurarZonaAction } from '../actions/configurar-zona.action';

interface ConfigurarZonaFormProps {
  zona: Zona;
}

export function ConfigurarZonaForm({ zona }: ConfigurarZonaFormProps) {
  const { state, pending, onSubmit } = useFormAction(configurarZonaAction);

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
      <input type="hidden" name="zonaId" value={zona.id} />
      <TextField
        label="Precio por entrada (Bs)"
        name="precio"
        inputMode="decimal"
        placeholder="Ej. 100"
        defaultValue={zona.precioCentavos === null ? '' : centavosABolivianos(zona.precioCentavos)}
        error={getFieldError(state, 'precio')}
      />
      <label className="flex min-h-12 items-center gap-2 text-sm font-semibold text-ink">
        <input
          type="checkbox"
          name="habilitada"
          defaultChecked={zona.habilitada}
          className="size-5 accent-brand"
        />
        Habilitada para la venta
      </label>
      <Button type="submit" variant="secondary" loading={pending}>
        Guardar
      </Button>
      <p role="status" className="text-sm sm:col-span-3">
        {state?.ok ? <span className="text-success">Cambios guardados.</span> : null}
        {state && !state.ok ? <span className="text-danger">{state.error}</span> : null}
      </p>
    </form>
  );
}
