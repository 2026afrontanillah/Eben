import { MarcaLogo } from '@/shared/brand/MarcaLogo';
import { MARCA } from '@/shared/brand/marca';

export function PanelFooter() {
  return (
    <footer className="border-t border-line bg-black/70 px-4 py-5 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-3 text-xs text-ink-subtle">
        <MarcaLogo className="size-9" />
        <span>
          <strong className="font-semibold text-ink">{MARCA.nombre}</strong> · Sistema de entradas
        </span>
      </div>
    </footer>
  );
}
