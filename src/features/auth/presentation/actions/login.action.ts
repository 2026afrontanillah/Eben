'use server';

import { redirect } from 'next/navigation';

import { getContainer } from '@/server/container';
import type { ActionResult } from '@/shared/actions/action-result';
import { toActionFailure } from '@/shared/actions/to-action-failure';
import { readText } from '@/shared/forms/form-data';

import { loginSchema } from '../../application/login.schema';
import { resolveSafeRedirect } from '../../application/safe-redirect';
import { setSessionCookie } from '../../server/session-cookie';

export async function loginAction(_previous: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const credenciales = loginSchema.parse({
      email: readText(formData, 'email'),
      password: readText(formData, 'password'),
    });
    const sesion = await getContainer().authService.iniciarSesion(credenciales.email, credenciales.password);
    await setSessionCookie(sesion.token, sesion.expiraEn);
  } catch (error) {
    return toActionFailure(error, 'loginAction');
  }

  redirect(resolveSafeRedirect(readText(formData, 'next')));
}
