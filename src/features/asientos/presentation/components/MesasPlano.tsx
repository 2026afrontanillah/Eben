import { contarSillasLibres, estaCompleta, type MesaEstado } from '../../domain/mesa';
import { AsientosLeyenda } from './AsientosLeyenda';
import { MesaSvg } from './MesaSvg';

interface MesasPlanoProps {
  zonaNombre: string;
  mesasPorFila: number;
  mesas: readonly MesaEstado[];
  onSeleccionarMesa: (numero: number) => void;
}

export function MesasPlano({ zonaNombre, mesasPorFila, mesas, onSeleccionarMesa }: MesasPlanoProps) {
  const filas = Math.ceil(mesas.length / mesasPorFila);

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-brand-ink">
          {zonaNombre}
        </span>
        <span className="text-xs text-ink-subtle">
          {mesas.length} mesas ({filas} filas de {mesasPorFila})
        </span>
      </div>

      {/* CONTENEDOR SIN SCROLL */}
      <div
        tabIndex={0}
        aria-label={`Plano de ${zonaNombre}: ${filas} filas de ${mesasPorFila} mesas`}
        className="w-full overflow-hidden rounded-2xl panel p-3 sm:p-4 focus-visible:outline-2 focus-visible:outline-focus"
      >
        <div className="w-full">
          <div className="mb-2 sm:mb-3 rounded-lg bg-brand py-2 text-center text-xs font-black tracking-[0.3em] text-brand-ink">
            ESCENARIO
          </div>

          <div
            className="grid gap-1 sm:gap-1.5"
            style={{ gridTemplateColumns: `repeat(${mesasPorFila}, minmax(0, 1fr))` }}
          >
            {mesas.map((mesa) => {
              const completa = estaCompleta(mesa);
              return (
                <button
                  key={mesa.numero}
                  type="button"
                  disabled={completa}
                  onClick={() => onSeleccionarMesa(mesa.numero)}
                  aria-label={`Mesa ${mesa.numero}: ${contarSillasLibres(mesa)} de ${mesa.sillas.length} sillas libres`}
                  className="rounded-md transition-transform hover:scale-110 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <MesaSvg mesa={mesa} className="block h-auto w-full" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <AsientosLeyenda />
    </div>
  );
}
