'use server';

import { redirect } from 'next/navigation';

import { authorizeAction } from '@/features/auth/server/guards';
import { getContainer } from '@/server/container';
import type { ActionResult } from '@/shared/actions/action-result';
import { toActionFailure } from '@/shared/actions/to-action-failure';
import { readText } from '@/shared/forms/form-data';

import { toDatosCliente, toDatosPago, ventaGeneralSchema } from '../../application/venta.schemas';
import { leerCamposClienteYPago } from './campos-venta';

export async function venderGeneralAction(_previous: ActionResult | null, formData: FormData): Promise<ActionResult> {
  let ventaId: string;

  try {
    const vendedor = await authorizeAction('VENDER');
    const datos = ventaGeneralSchema.parse({
      eventoId: readText(formData, 'eventoId'),
      zonaId: readText(formData, 'zonaId'),
      cantidad: readText(formData, 'cantidad'),
      ...leerCamposClienteYPago(formData),
    });

    const venta = await getContainer().venderEntradasGenerales.ejecutar({
      eventoId: datos.eventoId,
      zonaId: datos.zonaId,
      cantidad: datos.cantidad,
      cliente: toDatosCliente(datos),
      pago: toDatosPago(datos),
      vendedorId: vendedor.id,
    });
    ventaId = venta.id;
  } catch (error) {
    return toActionFailure(error, 'venderGeneralAction');
  }

  redirect(`/ventas/${ventaId}`);
}
