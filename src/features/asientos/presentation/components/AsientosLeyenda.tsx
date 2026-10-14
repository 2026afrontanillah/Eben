import { COLORES_SILLA } from './colores-asientos';

const ITEMS = [
  { etiqueta: 'Disponible', color: COLORES_SILLA.disponible.fill },
  { etiqueta: 'Seleccionada', color: COLORES_SILLA.seleccionada.fill },
  { etiqueta: 'Vendida', color: COLORES_SILLA.vendida.fill },
] as const;

export function AsientosLeyenda() {
  return (
    <ul className="flex flex-wrap justify-center gap-4 text-xs text-ink-muted">
      {ITEMS.map((item) => (
        <li key={item.etiqueta} className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-3 rounded-sm" style={{ background: item.color }} />
          {item.etiqueta}
        </li>
      ))}
    </ul>
  );
}
