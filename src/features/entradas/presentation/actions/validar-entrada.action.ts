'use server';

import { authorizeAction } from '@/features/auth/server/guards';
import { getContainer } from '@/server/container';
import { actionSuccess, type ActionResult } from '@/shared/actions/action-result';
import { toActionFailure } from '@/shared/actions/to-action-failure';
import { readText } from '@/shared/forms/form-data';

import type { ResultadoValidacion } from '../../domain/control-acceso';

export async function validarEntradaAction(
  _previous: ActionResult<ResultadoValidacion> | null,
  formData: FormData,
): Promise<ActionResult<ResultadoValidacion>> {
  try {
    const validador = await authorizeAction('VALIDAR_ENTRADAS');
    const resultado = await getContainer().validarEntrada.ejecutar({
      lectura: readText(formData, 'lectura'),
      validadorId: validador.id,
    });
    return actionSuccess(resultado);
  } catch (error) {
    return toActionFailure(error, 'validarEntradaAction');
  }
}
