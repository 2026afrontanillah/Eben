import { formatearBolivianos } from '@/shared/format/moneda';
import { Table, Td, Th } from '@/shared/ui/Table';

import type { ResumenZona } from '../../domain/resumen-ventas';

export function ResumenZonasTable({ zonas }: { zonas: readonly ResumenZona[] }) {
  return (
    <Table caption="Por zona">
      <thead>
        <tr>
          <Th>Zona</Th>
          <Th align="right">Vendidas</Th>
          <Th align="right" hideOnMobile>
            Disponibles
          </Th>
          <Th align="right">Recaudado</Th>
        </tr>
      </thead>
      <tbody>
        {zonas.map((zona) => (
          <tr key={zona.zonaId}>
            <Td>{zona.zonaNombre}</Td>
            <Td align="right">
              {zona.entradasVendidas} / {zona.capacidad}
            </Td>
            <Td align="right" hideOnMobile>
              {zona.disponibles}
            </Td>
            <Td align="right">{formatearBolivianos(zona.recaudadoCentavos)}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
