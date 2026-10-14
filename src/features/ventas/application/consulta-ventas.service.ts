import { tienePermiso } from '@/features/auth/domain/permisos';
import type { UsuarioSesion } from '@/features/auth/domain/usuario-sesion';
import type { EntradaQrSigner } from '@/features/entradas/application/entrada-qr-signer';
import { isUuid } from '@/shared/validation/uuid';

import { puedeVerVenta } from '../domain/acceso-venta';
import type { ConsultaVentasRepository } from '../domain/consulta-ventas.repository';
import type { EntradaDeVenta, VentaDetalle, VentaResumen } from '../domain/venta';
import { VentaNoEncontradaError } from '../domain/ventas.errors';

const LIMITE_LISTADO = 100;

export interface EntradaConQr extends EntradaDeVenta {
  qrToken: string;
}

export interface VentaConEntradasQr extends Omit<VentaDetalle, 'entradas'> {
  entradas: EntradaConQr[];
}

export class ConsultaVentasService {
  constructor(
    private readonly consulta: ConsultaVentasRepository,
    private readonly qrSigner: EntradaQrSigner,
  ) {}

  listar(usuario: UsuarioSesion, busqueda: string): Promise<VentaResumen[]> {
    const verTodas = tienePermiso(usuario.rol, 'VER_TODAS_LAS_VENTAS');
    return this.consulta.listar({
      vendedorId: verTodas ? undefined : usuario.id,
      busqueda: busqueda.trim() || undefined,
      limite: LIMITE_LISTADO,
    });
  }

  async obtenerDetalle(usuario: UsuarioSesion, ventaId: string): Promise<VentaConEntradasQr> {
    const venta = isUuid(ventaId) ? await this.consulta.obtenerDetalle(ventaId) : null;
    if (!venta || !puedeVerVenta(usuario, venta.vendedor.id)) {
      throw new VentaNoEncontradaError();
    }

    return {
      ...venta,
      entradas: venta.entradas.map((entrada) => ({ ...entrada, qrToken: this.qrSigner.sign(entrada.id) })),
    };
  }
}
