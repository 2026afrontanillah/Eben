'use client';

import { useState } from 'react';

import type { MesaEstado } from '@/features/asientos/domain/mesa';
import { MesasPlano } from '@/features/asientos/presentation/components/MesasPlano';

import { VentaAsientosDialog } from './VentaAsientosDialog';

interface VentaAsientosPanelProps {
  eventoId: string;
  zonaId: string;
  zonaNombre: string;
  precioUnitarioCentavos: number;
  mesasPorFila: number;
  mesas: readonly MesaEstado[];
}

export function VentaAsientosPanel({
  eventoId,
  zonaId,
  zonaNombre,
  precioUnitarioCentavos,
  mesasPorFila,
  mesas,
}: VentaAsientosPanelProps) {
  const [mesaSeleccionada, setMesaSeleccionada] = useState<number | null>(null);
  const mesa = mesas.find((candidata) => candidata.numero === mesaSeleccionada) ?? null;

  return (
    <>
      <MesasPlano
        zonaNombre={zonaNombre}
        mesasPorFila={mesasPorFila}
        mesas={mesas}
        onSeleccionarMesa={setMesaSeleccionada}
      />
      <VentaAsientosDialog
        eventoId={eventoId}
        zonaId={zonaId}
        zonaNombre={zonaNombre}
        precioUnitarioCentavos={precioUnitarioCentavos}
        mesa={mesa}
        onClose={() => setMesaSeleccionada(null)}
      />
    </>
  );
}
