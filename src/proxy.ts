import { NextResponse, type NextRequest } from 'next/server';

import { SESSION_COOKIE_NAME } from '@/features/auth/server/session-cookie-name';

const RUTA_LOGIN = '/login';

/**
 * Filtro optimista: solo comprueba que exista la cookie para redirigir rápido al login.
 * La validación real de la sesión y los permisos ocurre en cada página, acción y ruta API.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  if (pathname === RUTA_LOGIN || request.cookies.has(SESSION_COOKIE_NAME)) {
    return NextResponse.next();
  }

  const loginUrl = new URL(RUTA_LOGIN, request.url);
  loginUrl.searchParams.set('next', `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|icon\\.png|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)'],
};
