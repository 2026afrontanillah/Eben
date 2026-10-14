import { MARCA } from './marca';

interface MarcaWordmarkProps {
  className?: string;
  priority?: boolean;
}

export function MarcaWordmark({ className }: MarcaWordmarkProps) {
  return (
    <img
      src={MARCA.wordmark.src}
      alt={MARCA.nombre}
      width={MARCA.wordmark.width}
      height={MARCA.wordmark.height}
      className={className}
    />
  );
}
