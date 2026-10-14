import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './client/AuthContext';
import { RouterProvider, useRouter, matchPath } from './client/router';
import { MarcaBackground } from './shared/brand/MarcaBackground';
import { Header } from './client/components/Header';
import { Footer } from './client/components/Footer';

// Views
import { LoginView } from './client/views/LoginView';
import { EventosView } from './client/views/EventosView';
import { ZonaPlanoView } from './client/views/ZonaPlanoView';
import { VentasListView } from './client/views/VentasListView';
import { VentaDetalleView } from './client/views/VentaDetalleView';
import { ControlAccesoView } from './client/views/ControlAccesoView';
import { AdminResumenView } from './client/views/AdminResumenView';
import { AdminZonasView } from './client/views/AdminZonasView';
import { AdminUsuariosView } from './client/views/AdminUsuariosView';

function AppContent() {
  const { user, loading } = useAuth();
  const { pathname, navigate } = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== '/login') {
        navigate('/login');
      } else if (user && pathname === '/login') {
        navigate(user.rol === 'CONTROL' ? '/control' : '/');
      } else if (user && user.rol === 'CONTROL' && pathname !== '/control') {
        navigate('/control');
      }
    }
  }, [user, loading, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <span className="text-xs font-semibold text-ink-subtle">Cargando sistema…</span>
        </div>
      </div>
    );
  }

  if (!user || pathname === '/login') {
    return (
      <>
        <MarcaBackground />
        <LoginView />
      </>
    );
  }

  // Router dispatcher
  const renderRoute = () => {
    // Si el usuario es rol CONTROL, solo ve la pantalla de escaneo
    if (user.rol === 'CONTROL') {
      return <ControlAccesoView />;
    }

    // 1. Zona con plano de asientos: /eventos/:eventoId/zonas/:zonaId
    const mZona = matchPath('/eventos/:eventoId/zonas/:zonaId', pathname);
    if (mZona.match && mZona.params.zonaId) {
      return <ZonaPlanoView zonaId={mZona.params.zonaId} />;
    }

    // 2. Detalle de venta: /ventas/:id
    const mVenta = matchPath('/ventas/:id', pathname);
    if (mVenta.match && mVenta.params.id) {
      return <VentaDetalleView ventaId={mVenta.params.id} />;
    }

    // 3. Historial de ventas
    if (pathname === '/ventas') {
      return <VentasListView />;
    }

    // 4. Control de acceso
    if (pathname === '/control') {
      return <ControlAccesoView />;
    }

    // 5. Admin Resumen
    if (pathname === '/admin/resumen') {
      return <AdminResumenView />;
    }

    // 6. Admin Zonas
    if (pathname === '/admin/zonas') {
      return <AdminZonasView />;
    }

    // 7. Admin Usuarios
    if (pathname === '/admin/usuarios') {
      return <AdminUsuariosView />;
    }

    // Por defecto: Mapa de zonas / Evento activo
    return <EventosView />;
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <MarcaBackground />
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {renderRoute()}
      </main>
      <Footer />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </AuthProvider>
  );
}
