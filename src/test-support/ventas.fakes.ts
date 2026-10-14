import { vi } from 'vitest';

import type { Zona } from '@/features/eventos/domain/zona';
import type { ZonasRepository } from '@/features/eventos/domain/zonas.repository';
import type {
  NuevaVentaGeneral,
  NuevaVentaNumerada,
  RegistroVentasRepository,
} from '@/features/ventas/domain/registro-ventas.repository';
import type { DatosCliente, DatosPago } from '@/features/ventas/domain/venta';

export const CLIENTE: DatosCliente = { nombre: 'Juan Pérez', celular: '70012345', email: null };
export const PAGO_EFECTIVO: DatosPago = { metodo: 'EFECTIVO', referencia: null };

export function crearZonasRepositoryFalso(zona: Zona | null): ZonasRepository {
  return {
    listarPorEvento: vi.fn(async () => (zona ? [zona] : [])),
    obtenerPorId: vi.fn(async () => zona),
    actualizarConfiguracion: vi.fn(async () => undefined),
  };
}

export function crearRegistroVentasFalso() {
  const generales: NuevaVentaGeneral[] = [];
  const numeradas: NuevaVentaNumerada[] = [];
  const repositorio: RegistroVentasRepository = {
    registrarGeneral: vi.fn(async (venta: NuevaVentaGeneral) => {
      generales.push(venta);
      return { id: 'venta-1', codigo: venta.codigo };
    }),
    registrarNumerada: vi.fn(async (venta: NuevaVentaNumerada) => {
      numeradas.push(venta);
      return { id: 'venta-2', codigo: venta.codigo };
    }),
  };
  return { repositorio, generales, numeradas };
}
