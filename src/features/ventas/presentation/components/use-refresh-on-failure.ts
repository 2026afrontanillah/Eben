'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import type { ActionResult } from '@/shared/actions/action-result';

/** Tras un rechazo (stock agotado, silla vendida) recarga la disponibilidad que ve el vendedor. */
export function useRefreshOnFailure(state: ActionResult<unknown> | null): void {
  const router = useRouter();

  useEffect(() => {
    if (state && !state.ok) {
      router.refresh();
    }
  }, [state, router]);
}
