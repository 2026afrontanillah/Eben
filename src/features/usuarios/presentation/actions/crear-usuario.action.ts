'use server';

import { revalidatePath } from 'next/cache';

import { authorizeAction } from '@/features/auth/server/guards';
import { getContainer } from '@/server/container';
import { actionSuccess, type ActionResult } from '@/shared/actions/action-result';
import { toActionFailure } from '@/shared/actions/to-action-failure';
import { readText } from '@/shared/forms/form-data';

import { crearUsuarioSchema } from '../../application/usuario.schemas';

export async function crearUsuarioAction(_previous: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await authorizeAction('GESTIONAR_USUARIOS');
    const datos = crearUsuarioSchema.parse({
      nombre: readText(formData, 'nombre'),
      email: readText(formData, 'email'),
      rol: readText(formData, 'rol'),
      password: readText(formData, 'password'),
    });
    await getContainer().crearUsuario.ejecutar(datos);
    revalidatePath('/admin/usuarios');
  } catch (error) {
    return toActionFailure(error, 'crearUsuarioAction');
  }

  return actionSuccess(undefined);
}
