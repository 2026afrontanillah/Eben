const DESTINO_POR_DEFECTO = '/';

/** Evita redirecciones abiertas: solo se aceptan rutas internas de la aplicación. */
export function resolveSafeRedirect(destino: string): string {
  const esRutaInterna = destino.startsWith('/') && !destino.startsWith('//') && !destino.startsWith('/\\');
  return esRutaInterna ? destino : DESTINO_POR_DEFECTO;
}
