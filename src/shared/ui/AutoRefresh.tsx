import { useEffect } from 'react';

interface AutoRefreshProps {
  intervalMs: number;
  onRefresh?: () => void;
}

/** Mantiene la disponibilidad al día mientras otros vendedores registran ventas en paralelo. */
export function AutoRefresh({ intervalMs, onRefresh }: AutoRefreshProps) {
  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible' && onRefresh) {
        onRefresh();
      }
    };

    const intervalId = window.setInterval(refreshIfVisible, intervalMs);
    document.addEventListener('visibilitychange', refreshIfVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refreshIfVisible);
    };
  }, [onRefresh, intervalMs]);

  return null;
}
