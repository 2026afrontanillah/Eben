'use client';

import { useState } from 'react';

import { getFieldError } from '@/shared/actions/action-result';
import { useFormAction } from '@/shared/hooks/use-form-action';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';

import { venderGeneralAction } from '../actions/vender-general.action';
import { CantidadSelector } from './CantidadSelector';
import { ClienteFields } from './ClienteFields';
import { PagoFields } from './PagoFields';
import { TotalVenta } from './TotalVenta';
import { useRefreshOnFailure } from './use-refresh-on-failure';

interface VentaGeneralFormProps {
  eventoId: string;
  zonaId: string;
  precioUnitarioCentavos: number;
  cantidadMaxima: number;
}

export function VentaGeneralForm({ eventoId, zonaId, precioUnitarioCentavos, cantidadMaxima }: VentaGeneralFormProps) {
  const [cantidad, setCantidad] = useState(1);
  const { state, pending, onSubmit } = useFormAction(venderGeneralAction);
  useRefreshOnFailure(state);

  const cantidadVisible = Math.min(cantidad, cantidadMaxima);

  return (
    <form onSubmit={onSubmit} className="grid gap-6" noValidate>
      <input type="hidden" name="eventoId" value={eventoId} />
      <input type="hidden" name="zonaId" value={zonaId} />
      <div className="grid gap-3">
        <CantidadSelector
          value={cantidadVisible}
          max={cantidadMaxima}
          onChange={setCantidad}
          error={getFieldError(state, 'cantidad')}
        />
        <TotalVenta cantidad={cantidadVisible} precioUnitarioCentavos={precioUnitarioCentavos} />
      </div>
      <ClienteFields state={state} />
      <PagoFields state={state} />
      {state && !state.ok ? <Alert tone="error">{state.error}</Alert> : null}
      <Button type="submit" size="lg" fullWidth loading={pending}>
        {pending ? 'Registrando venta…' : 'Registrar venta y generar entradas'}
      </Button>
    </form>
  );
}
