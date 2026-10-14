import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { resolveSafeRedirect } from '@/features/auth/application/safe-redirect';
import { LoginForm } from '@/features/auth/presentation/components/LoginForm';
import { getUsuarioActual } from '@/features/auth/server/current-user';
import { MarcaLogo } from '@/shared/brand/MarcaLogo';
import { Card } from '@/shared/ui/Card';

export const metadata: Metadata = { title: 'Ingresar' };

interface LoginPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (await getUsuarioActual()) {
    redirect('/');
  }

  const { next } = await searchParams;
  const destino = resolveSafeRedirect(typeof next === 'string' ? next : '/');

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <MarcaLogo priority className="mx-auto mb-6 size-36 drop-shadow-[0_0_40px_rgb(255_255_255/0.15)]" />
        <Card>
          <h1 className="text-2xl font-extrabold text-ink">Ingresar</h1>
          <p className="mt-1 mb-5 text-sm text-ink-muted">Herramienta interna para relacionadores y vendedores.</p>
          <LoginForm redirectTo={destino} />
        </Card>
      </div>
    </main>
  );
}
