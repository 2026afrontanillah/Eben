import { ETIQUETAS_ROL } from '@/features/auth/domain/rol';
import { formatearBolivianos } from '@/shared/format/moneda';
import { Table, Td, Th } from '@/shared/ui/Table';

import type { ResumenVendedor } from '../../domain/resumen-ventas';

export function ResumenVendedoresTable({ vendedores }: { vendedores: readonly ResumenVendedor[] }) {
  return (
    <Table caption="Por vendedor o relacionador">
      <thead>
        <tr>
          <Th>Nombre</Th>
          <Th hideOnMobile>Rol</Th>
          <Th align="right" hideOnMobile>
            Ventas
          </Th>
          <Th align="right">Entradas</Th>
          <Th align="right">Monto</Th>
        </tr>
      </thead>
      <tbody>
        {vendedores.length === 0 ? (
          <tr>
            <Td>Todavía no hay ventas.</Td>
            <Td hideOnMobile>—</Td>
            <Td align="right" hideOnMobile>
              0
            </Td>
            <Td align="right">0</Td>
            <Td align="right">{formatearBolivianos(0)}</Td>
          </tr>
        ) : (
          vendedores.map((vendedor) => (
            <tr key={vendedor.vendedorId}>
              <Td>{vendedor.vendedorNombre}</Td>
              <Td hideOnMobile>{ETIQUETAS_ROL[vendedor.rol]}</Td>
              <Td align="right" hideOnMobile>
                {vendedor.ventas}
              </Td>
              <Td align="right">{vendedor.entradas}</Td>
              <Td align="right">{formatearBolivianos(vendedor.montoCentavos)}</Td>
            </tr>
          ))
        )}
      </tbody>
    </Table>
  );
}
