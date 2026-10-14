import { createQrSvgData } from '../../application/qr-matrix';

interface EntradaQrProps {
  token: string;
  codigo: string;
}

export function EntradaQr({ token, codigo }: EntradaQrProps) {
  const { viewBoxSize, path } = createQrSvgData(token);

  return (
    <svg
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      role="img"
      aria-label={`Código QR de la entrada ${codigo}`}
      shapeRendering="crispEdges"
      className="mx-auto my-3 block size-40 rounded-lg"
    >
      <rect width={viewBoxSize} height={viewBoxSize} fill="#FFFFFF" />
      <path d={path} fill="#111111" />
    </svg>
  );
}
