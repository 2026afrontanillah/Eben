import { ButtonLink } from '@/shared/ui/ButtonLink';

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-md text-center">
        <p className="text-sm font-bold tracking-widest text-ink-subtle uppercase">404</p>
        <h1 className="mt-2 text-3xl font-extrabold text-ink">No encontramos esta página</h1>
        <p className="mt-2 text-ink-muted">Puede que el enlace sea incorrecto o que no tengas acceso a este recurso.</p>
        <div className="mt-6">
          <ButtonLink href="/">Ir al inicio</ButtonLink>
        </div>
      </div>
    </main>
  );
}
