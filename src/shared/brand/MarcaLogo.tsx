import { MARCA } from './marca';

interface MarcaLogoProps {
  className?: string;
  priority?: boolean;
}

export function MarcaLogo({ className }: MarcaLogoProps) {
  return (
    <img
      src={MARCA.logo.src}
      alt={MARCA.nombre}
      width={MARCA.logo.width}
      height={MARCA.logo.height}
      className={className}
    />
  );
}
