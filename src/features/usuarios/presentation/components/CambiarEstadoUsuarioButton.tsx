'use client';

import { useActionState } from 'react';

import { Button } from '@/shared/ui/Button';

import { cambiarEstadoUsuarioAction } from '../actions/cambiar-estado-usuario.action';

interface CambiarEstadoUsuarioButtonProps {
  usuarioId: string;
  activo: boolean;
}

export function CambiarEstadoUsuarioButton({ usuarioId, activo }: CambiarEstadoUsuarioButtonProps) {
  const [state, formAction, pending] = useActionState(cambiarEstadoUsuarioAction, null);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="usuarioId" value={usuarioId} />
      <input type="hidden" name="activo" value={activo ? 'false' : 'true'} />
      <Button type="submit" size="sm" variant={activo ? 'secondary' : 'primary'} loading={pending}>
        {activo ? 'Desactivar' : 'Activar'}
      </Button>
      {state && !state.ok ? <p className="text-xs text-danger">{state.error}</p> : null}
    </form>
  );
}
