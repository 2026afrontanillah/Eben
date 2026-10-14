import { ETIQUETAS_METODO_PAGO } from '@/features/ventas/domain/metodo-pago';
import { formatearBolivianos } from '@/shared/format/moneda';
import { Table, Td, Th } from '@/shared/ui/Table';

import type { ResumenMetodoPago } from '../../domain/resumen-ventas';

export function ResumenMetodosPagoTable({ metodos }: { metodos: readonly ResumenMetodoPago[] }) {
  return (
    <Table caption="Por método de pago">
      <thead>
        <tr>
          <Th>Método</Th>
          <Th align="right">Pagos</Th>
          <Th align="right">Monto</Th>
        </tr>
      </thead>
      <tbody>
        {metodos.length === 0 ? (
          <tr>
            <Td>Sin pagos registrados.</Td>
            <Td align="right">0</Td>
            <Td align="right">{formatearBolivianos(0)}</Td>
          </tr>
        ) : (
          metodos.map((metodo) => (
            <tr key={metodo.metodo}>
              <Td>{ETIQUETAS_METODO_PAGO[metodo.metodo]}</Td>
              <Td align="right">{metodo.pagos}</Td>
              <Td align="right">{formatearBolivianos(metodo.montoCentavos)}</Td>
            </tr>
          ))
        )}
      </tbody>
    </Table>
  );
}
