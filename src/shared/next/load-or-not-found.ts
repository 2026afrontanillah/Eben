import { notFound } from 'next/navigation';

import { DomainError } from '@/shared/errors/domain-error';

/** En páginas de lectura, un recurso inexistente o ajeno se muestra como 404 en vez de un error. */
export async function loadOrNotFound<T>(load: () => Promise<T>): Promise<T> {
  try {
    return await load();
  } catch (error) {
    if (error instanceof DomainError) {
      notFound();
    }
    throw error;
  }
}
