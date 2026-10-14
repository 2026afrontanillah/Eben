'use client';

import { useEffect, useRef } from 'react';

import { ETIQUETAS_ROL, ROLES } from '@/features/auth/domain/rol';
import { getFieldError } from '@/shared/actions/action-result';
import { useFormAction } from '@/shared/hooks/use-form-action';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { SelectField } from '@/shared/ui/SelectField';
import { TextField } from '@/shared/ui/TextField';

import { crearUsuarioAction } from '../actions/crear-usuario.action';

const OPCIONES_ROL = ROLES.map((rol) => ({ value: rol, label: ETIQUETAS_ROL[rol] }));

export function CrearUsuarioForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const { state, pending, onSubmit } = useFormAction(crearUsuarioAction);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
      <TextField label="Nombre" name="nombre" autoComplete="off" required error={getFieldError(state, 'nombre')} />
      <TextField
        label="Email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="off"
        required
        error={getFieldError(state, 'email')}
      />
      <SelectField
        label="Rol"
        name="rol"
        options={OPCIONES_ROL}
        defaultValue="VENDEDOR"
        error={getFieldError(state, 'rol')}
      />
      <TextField
        label="Contraseña inicial"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="Mínimo 8 caracteres. Compártela en persona con el usuario."
        required
        error={getFieldError(state, 'password')}
      />
      <div className="grid gap-3 sm:col-span-2">
        {state && !state.ok ? <Alert tone="error">{state.error}</Alert> : null}
        {state?.ok ? <Alert tone="success">Usuario creado.</Alert> : null}
        <Button type="submit" loading={pending} className="sm:justify-self-start">
          Crear usuario
        </Button>
      </div>
    </form>
  );
}
