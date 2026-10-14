import { redirect } from 'next/navigation';

import { tienePermiso } from '@/features/auth/domain/permisos';
import { requireUsuario } from '@/features/auth/server/guards';
import { getContainer } from '@/server/container';
import { EmptyState } from '@/shared/ui/EmptyState';

export default async function InicioPage() {
  const usuario = await requireUsuario();

  if (!tienePermiso(usuario.rol, 'VENDER')) {
    redirect(tienePermiso(usuario.rol, 'VALIDAR_ENTRADAS') ? '/control' : '/ventas');
  }

  const evento = await getContainer().eventosService.obtenerEventoActivo();
  if (!evento) {
    return (
      <EmptyState title="No hay eventos a la venta">
        Cuando un administrador active un evento, aparecerá aquí su mapa de zonas.
      </EmptyState>
    );
  }

  redirect(`/eventos/${evento.id}`);
}
