'use client';

import { getFieldError } from '@/shared/actions/action-result';
import { useFormAction } from '@/shared/hooks/use-form-action';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { TextField } from '@/shared/ui/TextField';

import { loginAction } from '../actions/login.action';

interface LoginFormProps {
  redirectTo: string;
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const { state, pending, onSubmit } = useFormAction(loginAction);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="next" value={redirectTo} />
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="username"
        inputMode="email"
        required
        error={getFieldError(state, 'email')}
      />
      <TextField
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={getFieldError(state, 'password')}
      />
      {state && !state.ok ? <Alert tone="error">{state.error}</Alert> : null}
      <Button type="submit" size="lg" fullWidth loading={pending}>
        {pending ? 'Ingresando…' : 'Ingresar'}
      </Button>
    </form>
  );
}
