'use client';

import type { MesaEstado } from '@/features/asientos/domain/mesa';
import { AsientosLeyenda } from '@/features/asientos/presentation/components/AsientosLeyenda';
import { MesaSvg } from '@/features/asientos/presentation/components/MesaSvg';
import { useSeleccionSillas } from '@/features/asientos/presentation/hooks/use-seleccion-sillas';
import { getFieldError } from '@/shared/actions/action-result';
import { useFormAction } from '@/shared/hooks/use-form-action';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';

import { venderAsientosAction } from '../actions/vender-asientos.action';
import { ClienteFields } from './ClienteFields';
import { PagoFields } from './PagoFields';
import { TotalVenta } from './TotalVenta';
import { useRefreshOnFailure } from './use-refresh-on-failure';

interface VentaAsientosFormProps {
  eventoId: string;
  zonaId: string;
  precioUnitarioCentavos: number;
  mesa: MesaEstado;
}

export function VentaAsientosForm({ eventoId, zonaId, precioUnitarioCentavos, mesa }: VentaAsientosFormProps) {
  const { seleccion, alternar, limpiar } = useSeleccionSillas(mesa.sillas);
  const { state, pending, onSubmit } = useFormAction(venderAsientosAction);
  useRefreshOnFailure(state);

  const errorSillas = getFieldError(state, 'sillas');

  return (
    <form onSubmit={onSubmit} className="grid gap-5" noValidate>
      <input type="hidden" name="eventoId" value={eventoId} />
      <input type="hidden" name="zonaId" value={zonaId} />
      <input type="hidden" name="mesa" value={mesa.numero} />
      {[...seleccion].map((silla) => (
        <input key={silla} type="hidden" name="sillas" value={silla} />
      ))}

      <MesaSvg
        mesa={mesa}
        seleccionadas={seleccion}
        onAlternarSilla={alternar}
        className="mx-auto block h-72 max-w-full sm:h-80"
      />
      <AsientosLeyenda />
      <TotalVenta cantidad={seleccion.size} precioUnitarioCentavos={precioUnitarioCentavos} />
      {errorSillas ? <p className="text-sm text-danger">{errorSillas}</p> : null}

      <ClienteFields state={state} />
      <PagoFields state={state} />
      {state && !state.ok ? <Alert tone="error">{state.error}</Alert> : null}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" className="flex-1" onClick={limpiar} disabled={seleccion.size === 0 || pending}>
          Borrar selección
        </Button>
        <Button type="submit" className="flex-1" disabled={seleccion.size === 0} loading={pending}>
          {pending ? 'Vendiendo…' : 'Vender'}
        </Button>
      </div>
    </form>
  );
}
