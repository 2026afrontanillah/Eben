import type { Rol } from '@/features/auth/domain/rol';
import type { MetodoPago } from '@/features/ventas/domain/metodo-pago';

export interface ResumenZona {
  zonaId: string;
  zonaNombre: string;
  capacidad: number;
  disponibles: number;
  entradasVendidas: number;
  ventas: number;
  recaudadoCentavos: number;
}

export interface ResumenMetodoPago {
  metodo: MetodoPago;
  pagos: number;
  montoCentavos: number;
}

export interface ResumenVendedor {
  vendedorId: string;
  vendedorNombre: string;
  rol: Rol;
  ventas: number;
  entradas: number;
  montoCentavos: number;
}

export interface TotalesVentas {
  ventas: number;
  entradas: number;
  recaudadoCentavos: number;
  ingresados: number;
}

export interface ResumenVentas {
  totales: TotalesVentas;
  porZona: ResumenZona[];
  porMetodoPago: ResumenMetodoPago[];
  porVendedor: ResumenVendedor[];
}

export function calcularTotales(porZona: readonly ResumenZona[], ingresados: number): TotalesVentas {
  return porZona.reduce<TotalesVentas>(
    (totales, zona) => ({
      ventas: totales.ventas + zona.ventas,
      entradas: totales.entradas + zona.entradasVendidas,
      recaudadoCentavos: totales.recaudadoCentavos + zona.recaudadoCentavos,
      ingresados: totales.ingresados,
    }),
    { ventas: 0, entradas: 0, recaudadoCentavos: 0, ingresados },
  );
}
