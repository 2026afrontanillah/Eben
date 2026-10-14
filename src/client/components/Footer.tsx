import { MARCA } from '@/shared/brand/marca';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line py-6 text-center text-xs text-ink-subtle">
      <p>{MARCA.nombre} · Sistema interno de venta de entradas</p>
      <p className="mt-1">Node.js nativo con SQLite · Sin dependencias complejas</p>
    </footer>
  );
}
