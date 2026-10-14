import type { Metadata } from 'next';

import { requirePermiso } from '@/features/auth/server/guards';
import { ControlAccesoPanel } from '@/features/entradas/presentation/components/ControlAccesoPanel';
import { PageHeader } from '@/shared/ui/PageHeader';

export const metadata: Metadata = { title: 'Control de acceso' };

export default async function ControlPage() {
  await requirePermiso('VALIDAR_ENTRADAS');

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="Puerta"
        title="Control de acceso"
        description="Cada entrada se acepta una sola vez. Las anuladas y las ya usadas se rechazan."
      />
      <ControlAccesoPanel />
    </div>
  );
}
