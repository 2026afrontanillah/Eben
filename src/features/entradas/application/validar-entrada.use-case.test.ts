import { describe, expect, it, vi } from 'vitest';

import type { EntradaControl } from '../domain/control-acceso';
import type { ControlAccesoRepository } from '../domain/control-acceso.repository';
import { LecturaVaciaError } from '../domain/entradas.errors';
import { EntradaQrSigner } from './entrada-qr-signer';
import { ValidarEntradaUseCase } from './validar-entrada.use-case';

const AHORA = new Date('2026-10-13T23:00:00Z');
const signer = new EntradaQrSigner('secreto-de-prueba-con-mas-de-32-caracteres');

const entradaValida: EntradaControl = {
  id: '6f1c2a5e-8b3d-4e1f-9a2b-3c4d5e6f7a8b',
  codigo: 'GEN-7K2M9QXA-001',
  estado: 'VALIDA',
  eventoNombre: 'Kjarkas 55 años',
  zonaNombre: 'General',
  ubicacion: null,
  clienteNombre: 'Juan Pérez',
  usadaEn: null,
};

function crearRepositorio(entrada: EntradaControl | null, registrarIngreso = true): ControlAccesoRepository {
  return {
    buscarPorId: vi.fn(async (id: string) => (entrada?.id === id ? entrada : null)),
    buscarPorCodigo: vi.fn(async (codigo: string) => (entrada?.codigo === codigo ? entrada : null)),
    registrarIngreso: vi.fn(async () => registrarIngreso),
  };
}

function crearCasoDeUso(repositorio: ControlAccesoRepository) {
  return new ValidarEntradaUseCase(repositorio, signer, () => AHORA);
}

describe('ValidarEntradaUseCase', () => {
  it('admite una entrada válida leída por QR y registra el ingreso', async () => {
    const repositorio = crearRepositorio(entradaValida);

    const resultado = await crearCasoDeUso(repositorio).ejecutar({
      lectura: signer.sign(entradaValida.id),
      validadorId: 'portero-1',
    });

    expect(resultado).toEqual({ tipo: 'ADMITIDA', entrada: { ...entradaValida, estado: 'USADA', usadaEn: AHORA } });
    expect(repositorio.registrarIngreso).toHaveBeenCalledWith(entradaValida.id, 'portero-1', AHORA);
  });

  it('acepta el código escrito a mano sin importar mayúsculas', async () => {
    const resultado = await crearCasoDeUso(crearRepositorio(entradaValida)).ejecutar({
      lectura: ' gen-7k2m9qxa-001 ',
      validadorId: 'portero-1',
    });
    expect(resultado.tipo).toBe('ADMITIDA');
  });

  it('rechaza una entrada que ya ingresó sin volver a registrarla', async () => {
    const repositorio = crearRepositorio({ ...entradaValida, estado: 'USADA', usadaEn: AHORA });

    const resultado = await crearCasoDeUso(repositorio).ejecutar({ lectura: entradaValida.codigo, validadorId: 'p' });

    expect(resultado.tipo).toBe('YA_USADA');
    expect(repositorio.registrarIngreso).not.toHaveBeenCalled();
  });

  it('rechaza una entrada anulada', async () => {
    const resultado = await crearCasoDeUso(crearRepositorio({ ...entradaValida, estado: 'ANULADA' })).ejecutar({
      lectura: entradaValida.codigo,
      validadorId: 'p',
    });
    expect(resultado.tipo).toBe('ANULADA');
  });

  it('detecta un QR con firma falsa sin consultar la base de datos', async () => {
    const repositorio = crearRepositorio(entradaValida);
    const qrFalso = new EntradaQrSigner('secreto-falsificado-con-mas-de-32-caracteres').sign(entradaValida.id);

    const resultado = await crearCasoDeUso(repositorio).ejecutar({ lectura: qrFalso, validadorId: 'p' });

    expect(resultado).toEqual({ tipo: 'QR_INVALIDO' });
    expect(repositorio.buscarPorId).not.toHaveBeenCalled();
  });

  it('informa cuando el código no existe', async () => {
    const resultado = await crearCasoDeUso(crearRepositorio(null)).ejecutar({ lectura: 'XYZ', validadorId: 'p' });
    expect(resultado).toEqual({ tipo: 'NO_ENCONTRADA' });
  });

  it('si otro portero la registró primero, la reporta como ya usada', async () => {
    const repositorio = crearRepositorio(entradaValida, false);
    vi.mocked(repositorio.buscarPorId).mockResolvedValueOnce(entradaValida).mockResolvedValueOnce({
      ...entradaValida,
      estado: 'USADA',
      usadaEn: AHORA,
    });

    const resultado = await crearCasoDeUso(repositorio).ejecutar({
      lectura: signer.sign(entradaValida.id),
      validadorId: 'p',
    });

    expect(resultado.tipo).toBe('YA_USADA');
  });

  it('exige una lectura no vacía', async () => {
    await expect(
      crearCasoDeUso(crearRepositorio(entradaValida)).ejecutar({ lectura: '   ', validadorId: 'p' }),
    ).rejects.toBeInstanceOf(LecturaVaciaError);
  });
});
