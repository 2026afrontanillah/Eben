'use server';

import { revalidatePath } from 'next/cache';

import { authorizeAction } from '@/features/auth/server/guards';
import { getContainer } from '@/server/container';
import { actionSuccess, type ActionResult } from '@/shared/actions/action-result';
import { toActionFailure } from '@/shared/actions/to-action-failure';
import { readText } from '@/shared/forms/form-data';

import { configurarZonaSchema } from '../../application/configurar-zona.schema';

export async function configurarZonaAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await authorizeAction('CONFIGURAR_ZONAS');
    const datos = configurarZonaSchema.parse({
      zonaId: readText(formData, 'zonaId'),
      precio: readText(formData, 'precio'),
      habilitada: formData.get('habilitada') === 'on',
    });
    await getContainer().configurarZona.ejecutar({
      zonaId: datos.zonaId,
      precioCentavos: datos.precio,
      habilitada: datos.habilitada,
    });
  } catch (error) {
    return toActionFailure(error, 'configurarZonaAction');
  }

  revalidatePath('/', 'layout');
  return actionSuccess(undefined);
}
