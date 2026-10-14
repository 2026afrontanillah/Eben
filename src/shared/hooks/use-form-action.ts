'use client';

import { startTransition, useActionState, useCallback, type FormEvent } from 'react';

import type { ActionResult } from '@/shared/actions/action-result';

type FormServerAction<TData> = (
  previous: ActionResult<TData> | null,
  formData: FormData,
) => Promise<ActionResult<TData>>;

/**
 * Envía el formulario con `onSubmit` en lugar de `<form action>` porque React 19 resetea los
 * campos no controlados tras cada envío, y el vendedor perdería lo escrito al corregir un error.
 */
export function useFormAction<TData>(action: FormServerAction<TData>) {
  const [state, dispatch, pending] = useActionState(action, null);

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      startTransition(() => dispatch(formData));
    },
    [dispatch],
  );

  return { state, pending, onSubmit };
}
