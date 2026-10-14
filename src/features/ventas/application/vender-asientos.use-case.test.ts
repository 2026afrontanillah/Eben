import { describe, expect, it } from 'vitest';

import {
  CLIENTE,
  crearRegistroVentasFalso,
  crearZonasRepositoryFalso,
  PAGO_EFECTIVO,
} from '@/test-support/ventas.fakes';
import { crearZonaNumerada, EVENTO_ID } from '@/test-support/zona.fixture';

import { SeleccionAsientosInvalidaError } from '../domain/ventas.errors';
import { VenderAsientosUseCase } from './vender-asientos.use-case';

const zona = crearZonaNumerada();

function crearEscenario() {
  const registro = crearRegistroVentasFalso();
  const casoDeUso = new VenderAsientosUseCase(crearZonasRepositoryFalso(zona), registro.repositorio, () => 'WXYZ6789');
  return { casoDeUso, ...registro };
}

function solicitud(mesa: number, sillas: number[]) {
  return { eventoId: EVENTO_ID, zonaId: zona.id, mesa, sillas, cliente: CLIENTE, pago: PAGO_EFECTIVO, vendedorId: 'v-1' };
}

describe('VenderAsientosUseCase', () => {
  it('ordena las sillas y genera un código por silla', async () => {
    const { casoDeUso, numeradas } = crearEscenario();

    await casoDeUso.ejecutar(solicitud(12, [7, 3]));

    expect(numeradas[0]).toMatchObject({
      mesa: 12,
      totalCentavos: 20_000,
      entradas: [
        { silla: 3, codigo: 'VIP-M12-S3-WXYZ6789' },
        { silla: 7, codigo: 'VIP-M12-S7-WXYZ6789' },
      ],
    });
  });

  it.each<[string, number, number[]]>([
    ['una mesa inexistente', 141, [1]],
    ['una silla inexistente', 1, [11]],
    ['sillas repetidas', 1, [2, 2]],
    ['una selección vacía', 1, []],
  ])('rechaza %s', async (_caso, mesa, sillas) => {
    const { casoDeUso, repositorio } = crearEscenario();

    await expect(casoDeUso.ejecutar(solicitud(mesa, sillas))).rejects.toBeInstanceOf(SeleccionAsientosInvalidaError);
    expect(repositorio.registrarNumerada).not.toHaveBeenCalled();
  });
});
