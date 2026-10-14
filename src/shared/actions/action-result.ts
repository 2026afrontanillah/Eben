export type FieldErrors = Partial<Record<string, string[]>>;

export type ActionResult<TData = undefined> =
  | { ok: true; data: TData }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

export function actionSuccess<TData>(data: TData): ActionResult<TData> {
  return { ok: true, data };
}

export function actionFailure(error: string, fieldErrors?: FieldErrors): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

export function getFieldError<TData>(
  result: ActionResult<TData> | null,
  field: string,
): string | undefined {
  if (!result || result.ok) {
    return undefined;
  }
  return result.fieldErrors?.[field]?.[0];
}
