import { unstable_rethrow } from 'next/navigation';
import { ZodError, z } from 'zod';

import { DomainError } from '@/shared/errors/domain-error';
import { logger } from '@/shared/logging/logger';

import { actionFailure, type ActionResult } from './action-result';

const MENSAJE_ERROR_INESPERADO = 'Ocurrió un error inesperado. Intenta nuevamente.';
const MENSAJE_DATOS_INVALIDOS = 'Revisa los datos marcados.';

export function toActionFailure(error: unknown, context: string): ActionResult<never> {
  unstable_rethrow(error);

  if (error instanceof ZodError) {
    return actionFailure(MENSAJE_DATOS_INVALIDOS, z.flattenError(error).fieldErrors);
  }

  if (error instanceof DomainError) {
    return actionFailure(error.message);
  }

  logger.error(context, error);
  return actionFailure(MENSAJE_ERROR_INESPERADO);
}
