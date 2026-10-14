import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/shared/ui/Button';

interface Html5CameraScannerProps {
  onScan: (decodedText: string) => void;
  isPaused?: boolean;
}

interface CameraDevice {
  id: string;
  label: string;
}

export function Html5CameraScanner({ onScan, isPaused = false }: Html5CameraScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'html5-qr-reader-container';
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar cámaras disponibles
  useEffect(() => {
    let unmounted = false;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (unmounted) return;
        if (devices && devices.length > 0) {
          const list: CameraDevice[] = devices.map((d, idx) => ({
            id: d.id,
            label: d.label || `Cámara ${idx + 1}`,
          }));
          setCameras(list);

          // Buscar preferentemente la cámara trasera
          const rearCam = list.find(
            (c) =>
              c.label.toLowerCase().includes('back') ||
              c.label.toLowerCase().includes('trasera') ||
              c.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(rearCam ? rearCam.id : list[0].id);
        }
      })
      .catch((err) => {
        console.warn('Permiso o enumeración de cámaras:', err);
      });

    return () => {
      unmounted = true;
    };
  }, []);

  // Iniciar el escáner
  const startCamera = async (cameraId?: string) => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId);
      }

      const activeScanner = scannerRef.current;
      if (activeScanner.isScanning) {
        await activeScanner.stop();
      }

      const camIdToUse = cameraId || selectedCameraId;
      const cameraConfig = camIdToUse
        ? { deviceId: { exact: camIdToUse } }
        : { facingMode: 'environment' };

      await activeScanner.start(
        cameraConfig,
        {
          fps: 16,
          qrbox: (viewWidth, viewHeight) => {
            const minSide = Math.min(viewWidth, viewHeight);
            const size = Math.floor(minSide * 0.72);
            return { width: size, height: size };
          },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (!isPaused) {
            onScan(decodedText);
          }
        },
        () => {
          // cuadros sin código (noop)
        }
      );

      setIsScanning(true);

      // Verificar linterna (torch)
      try {
        const capabilities = activeScanner.getRunningTrackCapabilities();
        if (capabilities && (capabilities as any).torch) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }
      } catch {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.error('Error al iniciar cámara:', err);
      setCameraError('No se pudo acceder a la cámara. Revisa los permisos en tu navegador.');
      setIsScanning(false);
    }
  };

  // Detener la cámara
  const stopCamera = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
    } catch (err) {
      console.warn('Error al detener cámara:', err);
    } finally {
      setIsScanning(false);
      setIsTorchOn(false);
    }
  };

  // Alternar linterna
  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextState = !isTorchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState } as any],
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.warn('Error torch:', err);
    }
  };

  // Escanear desde archivo / foto
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId);
      }
      if (isScanning) {
        await stopCamera();
      }
      const decodedText = await scannerRef.current.scanFile(file, true);
      onScan(decodedText);
    } catch (err) {
      alert('No se detectó ningún código QR en la imagen seleccionada.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {});
        }
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {/* Viewport del Escáner */}
      <div className="relative aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-2xl border border-line bg-black shadow-2xl">
        {/* Contenedor real de video para Html5Qrcode */}
        <div id={containerId} className="size-full overflow-hidden [&_video]:size-full [&_video]:object-cover" />

        {/* Retícula visual y haz láser cuando está escaneando */}
        {isScanning && !isPaused && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative size-[72%] rounded-xl border border-white/20">
              {/* Esquinas destacadas */}
              <div className="absolute -top-1 -left-1 size-5 border-t-2 border-l-2 border-brand" />
              <div className="absolute -top-1 -right-1 size-5 border-t-2 border-r-2 border-brand" />
              <div className="absolute -bottom-1 -left-1 size-5 border-b-2 border-l-2 border-brand" />
              <div className="absolute -bottom-1 -right-1 size-5 border-b-2 border-r-2 border-brand" />

              {/* Haz láser animado */}
              <div className="animate-laser absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#fbbf24]" />
            </div>
          </div>
        )}

        {/* Placeholder cuando la cámara está apagada */}
        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface p-6 text-center text-ink-muted">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-line bg-surface-raised text-2xl text-ink">
              📷
            </div>
            <p className="text-xs text-ink-subtle">
              Cámara apagada. Haz clic en el botón inferior para encender el escáner de puerta.
            </p>
          </div>
        )}

        {/* Botón flotante de linterna si el dispositivo lo soporta */}
        {isScanning && hasTorch && (
          <button
            type="button"
            onClick={toggleTorch}
            className={`absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full border text-sm backdrop-blur-md transition ${
              isTorchOn
                ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                : 'border-white/20 bg-black/50 text-white hover:bg-black/70'
            }`}
            title="Encender linterna / Flash"
          >
            🔦
          </button>
        )}
      </div>

      {cameraError && (
        <p className="text-center text-xs font-semibold text-danger">{cameraError}</p>
      )}

      {/* Controles de cámara */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={isScanning ? 'secondary' : 'primary'}
            onClick={() => (isScanning ? stopCamera() : startCamera())}
            className="flex-1 text-xs py-2.5"
          >
            {isScanning ? '⏸️ Pausar cámara' : '📷 Encender escáner con cámara'}
          </Button>

          {/* Subir foto de QR */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs py-2.5 px-3"
            title="Subir imagen de código QR"
          >
            📁 Foto
          </Button>
        </div>

        {/* Selector de cámara si hay más de una */}
        {cameras.length > 1 && (
          <select
            value={selectedCameraId}
            onChange={(e) => {
              const newId = e.target.value;
              setSelectedCameraId(newId);
              if (isScanning) {
                startCamera(newId);
              }
            }}
            className="w-full rounded-xl border border-line bg-surface-raised px-3 py-2 text-xs text-ink focus:border-brand focus:outline-none"
          >
            {cameras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
