'use client';

import { useEffect, useId, useRef } from 'react';

import type { MesaEstado } from '@/features/asientos/domain/mesa';

import { VentaAsientosForm } from './VentaAsientosForm';

interface VentaAsientosDialogProps {
  eventoId: string;
  zonaId: string;
  zonaNombre: string;
  precioUnitarioCentavos: number;
  mesa: MesaEstado | null;
  onClose: () => void;
}

export function VentaAsientosDialog({
  eventoId,
  zonaId,
  zonaNombre,
  precioUnitarioCentavos,
  mesa,
  onClose,
}: VentaAsientosDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tituloId = useId();
  const abierto = mesa !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (abierto && !dialog.open) {
      dialog.showModal();
    }
    if (!abierto && dialog.open) {
      dialog.close();
    }
  }, [abierto]);

  const cerrar = () => dialogRef.current?.close();

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={tituloId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          cerrar();
        }
      }}
      className="m-auto max-h-[92dvh] w-[min(520px,calc(100%-20px))] overflow-auto rounded-2xl border border-line bg-surface p-5 text-ink backdrop:bg-black/75 backdrop:backdrop-blur-sm sm:p-6"
    >
      {mesa ? (
        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 id={tituloId} className="text-2xl font-extrabold text-ink">
              Mesa {mesa.numero} · {zonaNombre}
            </h2>
            <button
              type="button"
              onClick={cerrar}
              aria-label="Cerrar"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-strong text-2xl text-ink hover:bg-surface-strong"
            >
              ×
            </button>
          </div>
          <VentaAsientosForm
            key={mesa.numero}
            eventoId={eventoId}
            zonaId={zonaId}
            precioUnitarioCentavos={precioUnitarioCentavos}
            mesa={mesa}
          />
        </div>
      ) : null}
    </dialog>
  );
}
