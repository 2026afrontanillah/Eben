import { describe, expect, it, vi } from 'vitest';

import type { UsuarioSesion } from '@/features/auth/domain/usuario-sesion';
import { EntradaQrSigner } from '@/features/entradas/application/entrada-qr-signer';

import type { ConsultaVentasRepository } from '../domain/consulta-ventas.repository';
import type { VentaDetalle } from '../domain/venta';
import { VentaNoEncontradaError } from '../domain/ventas.errors';
import { ConsultaVentasService } from './consulta-ventas.service';

const VENTA_ID = '44444444-4444-4444-8444-444444444444';
const signer = new EntradaQrSigner('secreto-de-prueba-con-mas-de-32-caracteres');

const vendedora: UsuarioSesion = { id: 'vendedora', nombre: 'Ana', email: 'ana@rela.bo', rol: 'RELACIONADOR' };
const otroVendedor: UsuarioSesion = { id: 'otro', nombre: 'Luis', email: 'luis@rela.bo', rol: 'VENDEDOR' };
const admin: UsuarioSesion = { id: 'admin', nombre: 'Admin', email: 'admin@rela.bo', rol: 'ADMIN' };

const venta = {
  id: VENTA_ID,
  vendedor: { id: 'vendedora', nombre: 'Ana' },
  entradas: [{ id: '55555555-5555-4555-8555-555555555555', codigo: 'GEN-X-001', estado: 'VALIDA', ubicacion: null, usadaEn: null }],
} as unknown as VentaDetalle;

function crearServicio() {
  const repositorio: ConsultaVentasRepository = {
    obtenerDetalle: vi.fn(async (id: string) => (id === VENTA_ID ? venta : null)),
    listar: vi.fn(async () => []),
  };
  return { servicio: new ConsultaVentasService(repositorio, signer), repositorio };
}

describe('ConsultaVentasService', () => {
  it('un vendedor solo lista sus propias ventas', async () => {
    const { servicio, repositorio } = crearServicio();

    await servicio.listar(vendedora, '  juan ');

    expect(repositorio.listar).toHaveBeenCalledWith({ vendedorId: 'vendedora', busqueda: 'juan', limite: 100 });
  });

  it('el administrador lista las ventas de todos', async () => {
    const { servicio, repositorio } = crearServicio();

    await servicio.listar(admin, '');

    expect(repositorio.listar).toHaveBeenCalledWith({ vendedorId: undefined, busqueda: undefined, limite: 100 });
  });

  it('agrega el QR firmado a cada entrada', async () => {
    const { servicio } = crearServicio();

    const detalle = await servicio.obtenerDetalle(vendedora, VENTA_ID);

    expect(signer.verify(detalle.entradas[0]?.qrToken ?? '')).toBe('55555555-5555-4555-8555-555555555555');
  });

  it('oculta la venta a otro vendedor como si no existiera', async () => {
    const { servicio } = crearServicio();
    await expect(servicio.obtenerDetalle(otroVendedor, VENTA_ID)).rejects.toBeInstanceOf(VentaNoEncontradaError);
  });

  it('no consulta la base de datos con ids mal formados', async () => {
    const { servicio, repositorio } = crearServicio();

    await expect(servicio.obtenerDetalle(admin, 'no-es-uuid')).rejects.toBeInstanceOf(VentaNoEncontradaError);
    expect(repositorio.obtenerDetalle).not.toHaveBeenCalled();
  });
});
