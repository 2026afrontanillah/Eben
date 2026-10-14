'use server';

import { revalidatePath } from 'next/cache';

import { authorizeAction } from '@/features/auth/server/guards';
import { getContainer } from '@/server/container';
import { actionSuccess, type ActionResult } from '@/shared/actions/action-result';
import { toActionFailure } from '@/shared/actions/to-action-failure';
import { readText } from '@/shared/forms/form-data';

import { cambiarEstadoUsuarioSchema } from '../../application/usuario.schemas';

export async function cambiarEstadoUsuarioAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const solicitante = await authorizeAction('GESTIONAR_USUARIOS');
    const datos = cambiarEstadoUsuarioSchema.parse({
      usuarioId: readText(formData, 'usuarioId'),
      activo: readText(formData, 'activo'),
    });
    await getContainer().cambiarEstadoUsuario.ejecutar({ ...datos, solicitanteId: solicitante.id });
    revalidatePath('/admin/usuarios');
  } catch (error) {
    return toActionFailure(error, 'cambiarEstadoUsuarioAction');
  }

  return actionSuccess(undefined);
}
