'use client';

import { getFieldError } from '@/shared/actions/action-result';
import { useFormAction } from '@/shared/hooks/use-form-action';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { TextAreaField } from '@/shared/ui/TextAreaField';

import { anularVentaAction } from '../actions/anular-venta.action';

interface AnularVentaFormProps {
  ventaId: string;
}

export function AnularVentaForm({ ventaId }: AnularVentaFormProps) {
  const { state, pending, onSubmit } = useFormAction(anularVentaAction);

  return (
    <details className="rounded-2xl panel border-danger/40 p-5">
      <summary className="cursor-pointer font-bold text-danger">Anular esta venta</summary>
      <form onSubmit={onSubmit} className="mt-4 grid gap-4" noValidate>
        <input type="hidden" name="ventaId" value={ventaId} />
        <p className="text-sm text-ink-muted">
          Las entradas quedarán inválidas en la puerta y los cupos o sillas volverán a estar disponibles. No se puede
          deshacer.
        </p>
        <TextAreaField
          label="Motivo de la anulación"
          name="motivo"
          maxLength={300}
          required
          error={getFieldError(state, 'motivo')}
        />
        {state && !state.ok ? <Alert tone="error">{state.error}</Alert> : null}
        <Button type="submit" variant="danger" loading={pending}>
          Confirmar anulación
        </Button>
      </form>
    </details>
  );
}
