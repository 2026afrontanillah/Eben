'use client';

import { Button } from '@/shared/ui/Button';

import { useQrCameraScanner } from '../hooks/use-qr-camera-scanner';

interface CamaraScannerProps {
  onDetect: (lectura: string) => void;
}

export function CamaraScanner({ onDetect }: CamaraScannerProps) {
  const { videoRef, soportado, activo, error, iniciar, detener } = useQrCameraScanner(onDetect);

  if (!soportado) {
    return (
      <p className="text-xs text-ink-subtle">
        Este navegador no permite escanear con la cámara. Usa un lector QR o escribe el código.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {activo ? (
        <video ref={videoRef} muted playsInline className="aspect-square w-full max-w-sm justify-self-center rounded-xl bg-black object-cover" />
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button variant="secondary" onClick={activo ? detener : iniciar}>
        {activo ? 'Detener cámara' : 'Escanear con la cámara'}
      </Button>
    </div>
  );
}
