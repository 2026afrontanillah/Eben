interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetectorInstance {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
}

type BarcodeDetectorConstructor = new (options: { formats: string[] }) => BarcodeDetectorInstance;

/** `BarcodeDetector` aún no está en los tipos del DOM; existe en Chrome/Edge para Android y escritorio. */
export function getBarcodeDetector(): BarcodeDetectorConstructor | null {
  return (globalThis as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector ?? null;
}

export function isCameraScanSupported(): boolean {
  return getBarcodeDetector() !== null && typeof navigator.mediaDevices?.getUserMedia === 'function';
}
