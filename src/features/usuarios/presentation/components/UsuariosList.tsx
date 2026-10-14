import { ETIQUETAS_ROL } from '@/features/auth/domain/rol';
import { Badge } from '@/shared/ui/Badge';

import type { UsuarioListado } from '../../domain/usuario';
import { CambiarEstadoUsuarioButton } from './CambiarEstadoUsuarioButton';

interface UsuariosListProps {
  usuarios: readonly UsuarioListado[];
  usuarioActualId: string;
}

export function UsuariosList({ usuarios, usuarioActualId }: UsuariosListProps) {
  return (
    <ul className="grid gap-3">
      {usuarios.map((usuario) => (
        <li
          key={usuario.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl panel p-4"
        >
          <div className="min-w-0">
            <p className="font-bold text-ink">
              {usuario.nombre}
              {usuario.id === usuarioActualId ? <span className="font-normal text-ink-subtle"> (tú)</span> : null}
            </p>
            <p className="text-sm break-all text-ink-muted">{usuario.email}</p>
            <div className="mt-2 flex gap-2">
              <Badge tone="inverse">{ETIQUETAS_ROL[usuario.rol]}</Badge>
              <Badge tone={usuario.activo ? 'success' : 'neutral'}>{usuario.activo ? 'Activo' : 'Inactivo'}</Badge>
            </div>
          </div>
          {usuario.id === usuarioActualId ? null : (
            <CambiarEstadoUsuarioButton usuarioId={usuario.id} activo={usuario.activo} />
          )}
        </li>
      ))}
    </ul>
  );
}
