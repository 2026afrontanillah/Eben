'use server';

import { revalidatePath } from 'next/cache';

import { authorizeAction } from '@/features/auth/server/guards';
import { getContainer } from '@/server/container';
import { actionSuccess, type ActionResult } from '@/shared/actions/action-result';
import { toActionFailure } from '@/shared/actions/to-action-failure';
import { readText } from '@/shared/forms/form-data';

import { anularVentaSchema } from '../../application/venta.schemas';

export async function anularVentaAction(_previous: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const usuario = await authorizeAction('ANULAR_VENTAS');
    const datos = anularVentaSchema.parse({
      ventaId: readText(formData, 'ventaId'),
      motivo: readText(formData, 'motivo'),
    });
    await getContainer().anularVenta.ejecutar({ ...datos, usuarioId: usuario.id });
    revalidatePath(`/ventas/${datos.ventaId}`);
  } catch (error) {
    return toActionFailure(error, 'anularVentaAction');
  }

  return actionSuccess(undefined);
}
