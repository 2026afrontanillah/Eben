'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { getBarcodeDetector, isCameraScanSupported } from './barcode-detector';

const INTERVALO_ESCANEO_MS = 250;
const PAUSA_MISMO_CODIGO_MS = 3000;

const subscribeNoop = () => () => {};

export function useQrCameraScanner(onDetect: (lectura: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onDetectRef = useRef(onDetect);
  const [activo, setActivo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const soportado = useSyncExternalStore(subscribeNoop, isCameraScanSupported, () => false);

  useEffect(() => {
    onDetectRef.current = onDetect;
  }, [onDetect]);

  useEffect(() => {
    const Detector = getBarcodeDetector();
    if (!activo || !Detector) {
      return;
    }

    const detector = new Detector({ formats: ['qr_code'] });
    let stream: MediaStream | null = null;
    let timeoutId: number | undefined;
    let cancelado = false;
    let ultimaLectura = { valor: '', instante: 0 };

    const escanear = async (video: HTMLVideoElement) => {
      if (cancelado) {
        return;
      }
      try {
        const [codigo] = await detector.detect(video);
        const ahora = Date.now();
        const repetida = codigo?.rawValue === ultimaLectura.valor && ahora - ultimaLectura.instante < PAUSA_MISMO_CODIGO_MS;
        if (codigo && !repetida) {
          ultimaLectura = { valor: codigo.rawValue, instante: ahora };
          onDetectRef.current(codigo.rawValue);
        }
      } catch {
        // El primer cuadro puede no estar listo todavía; se reintenta en el siguiente ciclo.
      }
      timeoutId = window.setTimeout(() => void escanear(video), INTERVALO_ESCANEO_MS);
    };

    const iniciar = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        const video = videoRef.current;
        if (cancelado || !video) {
          return;
        }
        video.srcObject = stream;
        await video.play();
        void escanear(video);
      } catch {
        setError('No se pudo usar la cámara. Revisa los permisos del navegador.');
        setActivo(false);
      }
    };

    void iniciar();

    return () => {
      cancelado = true;
      window.clearTimeout(timeoutId);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [activo]);

  const iniciar = useCallback(() => {
    setError(null);
    setActivo(true);
  }, []);
  const detener = useCallback(() => setActivo(false), []);

  return { videoRef, soportado, activo, error, iniciar, detener };
}
