import type { UsuarioSesion } from '@/features/auth/domain/usuario-sesion';
import type { EntradasPdfRenderer } from '@/features/entradas/application/entradas-pdf.renderer';

import { ETIQUETAS_METODO_PAGO } from '../domain/metodo-pago';
import { EntradaDeVentaNoEncontradaError, VentaAnuladaError } from '../domain/ventas.errors';
import type { ConsultaVentasService, EntradaConQr, VentaConEntradasQr } from './consulta-ventas.service';

export interface PdfGenerado {
  nombreArchivo: string;
  contenido: Uint8Array;
}

export class GenerarPdfVentaUseCase {
  constructor(
    private readonly consultaVentas: ConsultaVentasService,
    private readonly renderer: EntradasPdfRenderer,
  ) {}

  async ejecutar(usuario: UsuarioSesion, ventaId: string, entradaId: string | null): Promise<PdfGenerado> {
    const venta = await this.consultaVentas.obtenerDetalle(usuario, ventaId);
    if (venta.estado === 'ANULADA') {
      throw new VentaAnuladaError();
    }

    const entradas = this.seleccionarEntradas(venta, entradaId);
    const [primera] = entradas;
    if (!primera) {
      throw new EntradaDeVentaNoEncontradaError();
    }

    const metodoPago = venta.pagos[0]?.metodo;
    const contenido = await this.renderer.render({
      eventoNombre: venta.evento.nombre,
      zonaNombre: venta.zona.nombre,
      clienteNombre: venta.cliente.nombre,
      precioUnitarioCentavos: venta.precioUnitarioCentavos,
      metodoPagoEtiqueta: metodoPago ? ETIQUETAS_METODO_PAGO[metodoPago] : 'Registrado',
      entradas: entradas.map(({ codigo, qrToken, ubicacion }) => ({ codigo, qrToken, ubicacion })),
    });

    const nombreArchivo = entradas.length === 1 ? `entrada-${primera.codigo}.pdf` : `entradas-${venta.codigo}.pdf`;
    return { nombreArchivo, contenido };
  }

  private seleccionarEntradas(venta: VentaConEntradasQr, entradaId: string | null): EntradaConQr[] {
    const vigentes = venta.entradas.filter((entrada) => entrada.estado !== 'ANULADA');
    return entradaId ? vigentes.filter((entrada) => entrada.id === entradaId) : vigentes;
  }
}
