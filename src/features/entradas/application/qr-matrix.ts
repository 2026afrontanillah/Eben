import QRCode from 'qrcode';

export interface QrMatrix {
  size: number;
  isDark(row: number, column: number): boolean;
}

export const QR_QUIET_ZONE = 4;

export function createQrMatrix(text: string): QrMatrix {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' });
  return {
    size: modules.size,
    isDark: (row, column) => Boolean(modules.get(row, column)),
  };
}

export function forEachDarkModule(matrix: QrMatrix, callback: (row: number, column: number) => void): void {
  for (let row = 0; row < matrix.size; row += 1) {
    for (let column = 0; column < matrix.size; column += 1) {
      if (matrix.isDark(row, column)) {
        callback(row, column);
      }
    }
  }
}

export interface QrSvgData {
  viewBoxSize: number;
  path: string;
}

export function createQrSvgData(text: string): QrSvgData {
  const matrix = createQrMatrix(text);
  const segments: string[] = [];
  forEachDarkModule(matrix, (row, column) => {
    segments.push(`M${column + QR_QUIET_ZONE} ${row + QR_QUIET_ZONE}h1v1h-1z`);
  });
  return { viewBoxSize: matrix.size + QR_QUIET_ZONE * 2, path: segments.join('') };
}
