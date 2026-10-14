'use client';

import { Button } from '@/shared/ui/Button';

interface PanelErrorProps {
  reset: () => void;
}

export default function PanelError({ reset }: PanelErrorProps) {
  return (
    <div role="alert" className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-extrabold text-ink">Algo salió mal</h1>
      <p className="mt-2 text-ink-muted">
        No pudimos cargar esta pantalla. Revisa tu conexión e intenta nuevamente.
      </p>
      <Button className="mt-6" onClick={reset}>
        Reintentar
      </Button>
    </div>
  );
}
