import type { Metadata } from 'next';

import { requirePermiso } from '@/features/auth/server/guards';
import { CrearUsuarioForm } from '@/features/usuarios/presentation/components/CrearUsuarioForm';
import { UsuariosList } from '@/features/usuarios/presentation/components/UsuariosList';
import { getContainer } from '@/server/container';
import { Card } from '@/shared/ui/Card';
import { PageHeader } from '@/shared/ui/PageHeader';

export const metadata: Metadata = { title: 'Usuarios' };

export default async function UsuariosPage() {
  const administrador = await requirePermiso('GESTIONAR_USUARIOS');
  const usuarios = await getContainer().listarUsuarios.ejecutar();

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Administración"
        title="Usuarios"
        description="Relacionadores y vendedores pueden vender; control de acceso solo valida entradas en puerta."
      />
      <Card>
        <h2 className="mb-4 text-lg font-extrabold text-ink">Nuevo usuario</h2>
        <CrearUsuarioForm />
      </Card>
      <section aria-labelledby="equipo-titulo" className="grid gap-3">
        <h2 id="equipo-titulo" className="text-lg font-extrabold text-ink">
          Equipo ({usuarios.length})
        </h2>
        <UsuariosList usuarios={usuarios} usuarioActualId={administrador.id} />
      </section>
    </div>
  );
}
