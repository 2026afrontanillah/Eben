interface PlanoZoomControlsProps {
  zoom: number;
  puedeAcercar: boolean;
  puedeAlejar: boolean;
  onAcercar: () => void;
  onAlejar: () => void;
  onRestablecer: () => void;
}

const CONTROL_CLASS =
  'min-h-11 min-w-11 rounded-xl border border-line-strong bg-surface-raised px-3 text-sm font-bold text-ink hover:bg-surface-strong disabled:opacity-40';

export function PlanoZoomControls({
  zoom,
  puedeAcercar,
  puedeAlejar,
  onAcercar,
  onAlejar,
  onRestablecer,
}: PlanoZoomControlsProps) {
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" className={CONTROL_CLASS} onClick={onAlejar} disabled={!puedeAlejar} aria-label="Reducir plano">
        −
      </button>
      <span className="w-12 text-center text-sm text-ink-muted" aria-live="polite">
        {Math.round(zoom * 100)}%
      </span>
      <button type="button" className={CONTROL_CLASS} onClick={onAcercar} disabled={!puedeAcercar} aria-label="Ampliar plano">
        +
      </button>
      <button type="button" className={CONTROL_CLASS} onClick={onRestablecer} disabled={!puedeAlejar}>
        Ver todo
      </button>
    </div>
  );
}
