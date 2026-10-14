import { describe, expect, it } from 'vitest';

import { ZonaNoEncontradaError } from '@/features/eventos/domain/eventos.errors';
import type { Zona } from '@/features/eventos/domain/zona';
import {
  CLIENTE,
  crearRegistroVentasFalso,
  crearZonasRepositoryFalso,
  PAGO_EFECTIVO,
} from '@/test-support/ventas.fakes';
import { crearZonaGeneral, crearZonaNumerada, EVENTO_ID } from '@/test-support/zona.fixture';

import { CantidadInvalidaError, StockInsuficienteError, ZonaNoVendibleError } from '../domain/ventas.errors';
import { VenderEntradasGeneralesUseCase } from './vender-entradas-generales.use-case';

function crearEscenario(zona: Zona | null) {
  const registro = crearRegistroVentasFalso();
  const casoDeUso = new VenderEntradasGeneralesUseCase(
    crearZonasRepositoryFalso(zona),
    registro.repositorio,
    () => 'ABCD2345',
  );
  return { casoDeUso, ...registro };
}

function solicitud(cantidad: number, zona: Zona = crearZonaGeneral()) {
  return { eventoId: EVENTO_ID, zonaId: zona.id, cantidad, cliente: CLIENTE, pago: PAGO_EFECTIVO, vendedorId: 'vendedor-1' };
}

describe('VenderEntradasGeneralesUseCase', () => {
  it('registra la venta con el precio de la zona y una entrada numerada por unidad', async () => {
    const { casoDeUso, generales } = crearEscenario(crearZonaGeneral());

    await casoDeUso.ejecutar(solicitud(3));

    expect(generales).toHaveLength(1);
    expect(generales[0]).toMatchObject({
      codigo: 'V-ABCD2345',
      precioUnitarioCentavos: 5_000,
      totalCentavos: 15_000,
      vendedorId: 'vendedor-1',
      codigosEntrada: ['GEN-ABCD2345-001', 'GEN-ABCD2345-002', 'GEN-ABCD2345-003'],
    });
  });

  it.each([0, 21, 1.5])('rechaza la cantidad %s', async (cantidad) => {
    const { casoDeUso } = crearEscenario(crearZonaGeneral());
    await expect(casoDeUso.ejecutar(solicitud(cantidad))).rejects.toBeInstanceOf(CantidadInvalidaError);
  });

  it('rechaza vender más de lo disponible', async () => {
    const { casoDeUso } = crearEscenario(crearZonaGeneral({ disponibles: 2 }));
    await expect(casoDeUso.ejecutar(solicitud(3))).rejects.toThrow(new StockInsuficienteError(2, 'General'));
  });

  it.each<[string, Zona]>([
    ['sin precio', crearZonaGeneral({ precioCentavos: null })],
    ['deshabilitada', crearZonaGeneral({ habilitada: false })],
    ['numerada', crearZonaNumerada()],
  ])('rechaza una zona %s', async (_caso, zona) => {
    const { casoDeUso, repositorio } = crearEscenario(zona);

    await expect(casoDeUso.ejecutar(solicitud(1, zona))).rejects.toBeInstanceOf(ZonaNoVendibleError);
    expect(repositorio.registrarGeneral).not.toHaveBeenCalled();
  });

  it('rechaza una zona de otro evento', async () => {
    const { casoDeUso } = crearEscenario(crearZonaGeneral({ eventoId: '99999999-9999-4999-8999-999999999999' }));
    await expect(casoDeUso.ejecutar(solicitud(1))).rejects.toBeInstanceOf(ZonaNoEncontradaError);
  });
});
