'use server';

import { redirect } from 'next/navigation';

import { getContainer } from '@/server/container';

import { clearSessionCookie, readSessionCookie } from '../../server/session-cookie';

export async function logoutAction(): Promise<void> {
  const token = await readSessionCookie();
  if (token) {
    await getContainer().authService.cerrarSesion(token);
  }
  await clearSessionCookie();
  redirect('/login');
}
