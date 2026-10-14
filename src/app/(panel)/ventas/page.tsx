import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { tienePermiso } from '@/features/auth/domain/permisos';
import { requireUsuario } from '@/features/auth/server/guards';
import { puedeListarVentas } from '@/features/ventas/domain/acceso-venta';
import { VentaCard } from '@/features/ventas/presentation/components/VentaCard';
import { VentasSearchForm } from '@/features/ventas/presentation/components/VentasSearchForm';
import { getContainer } from '@/server/container';
import { EmptyState } from '@/shared/ui/EmptyState';
import { PageHeader } from '@/shared/ui/PageHeader';

export const metadata: Metadata = { title: 'Ventas' };

interface VentasPageProps {
  searchParams: Promise<{ q?: string | string[] }>;
}

export default async function VentasPage({ searchParams }: VentasPageProps) {
  const usuario = await requireUsuario();
  if (!puedeListarVentas(usuario)) {
    redirect('/');
  }

  const { q } = await searchParams;
  const busqueda = typeof q === 'string' ? q : '';
  const verTodas = tienePermiso(usuario.rol, 'VER_TODAS_LAS_VENTAS');
  const ventas = await getContainer().consultaVentas.listar(usuario, busqueda);

  return (
    <>
      <PageHeader
        title={verTodas ? 'Ventas' : 'Mis ventas'}
        description={verTodas ? 'Últimas 100 ventas de todo el equipo.' : 'Tus últimas 100 ventas.'}
      />
      <div className="grid gap-5">
        <VentasSearchForm busqueda={busqueda} />
        {ventas.length === 0 ? (
          <EmptyState title={busqueda ? 'Sin resultados' : 'Todavía no hay ventas'}>
            {busqueda ? 'Prueba con otro nombre, celular o código.' : 'Las ventas que registres aparecerán aquí.'}
          </EmptyState>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {ventas.map((venta) => (
              <li key={venta.id}>
                <VentaCard venta={venta} mostrarVendedor={verTodas} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
