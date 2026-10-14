'use server';

import { redirect } from 'next/navigation';

import { authorizeAction } from '@/features/auth/server/guards';
import { getContainer } from '@/server/container';
import type { ActionResult } from '@/shared/actions/action-result';
import { toActionFailure } from '@/shared/actions/to-action-failure';
import { readText, readTextList } from '@/shared/forms/form-data';

import { toDatosCliente, toDatosPago, ventaAsientosSchema } from '../../application/venta.schemas';
import { leerCamposClienteYPago } from './campos-venta';

export async function venderAsientosAction(_previous: ActionResult | null, formData: FormData): Promise<ActionResult> {
  let ventaId: string;

  try {
    const vendedor = await authorizeAction('VENDER');
    const datos = ventaAsientosSchema.parse({
      eventoId: readText(formData, 'eventoId'),
      zonaId: readText(formData, 'zonaId'),
      mesa: readText(formData, 'mesa'),
      sillas: readTextList(formData, 'sillas'),
      ...leerCamposClienteYPago(formData),
    });

    const venta = await getContainer().venderAsientos.ejecutar({
      eventoId: datos.eventoId,
      zonaId: datos.zonaId,
      mesa: datos.mesa,
      sillas: datos.sillas,
      cliente: toDatosCliente(datos),
      pago: toDatosPago(datos),
      vendedorId: vendedor.id,
    });
    ventaId = venta.id;
  } catch (error) {
    return toActionFailure(error, 'venderAsientosAction');
  }

  redirect(`/ventas/${ventaId}`);
}
