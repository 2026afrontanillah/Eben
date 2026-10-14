import { rgb, type PDFDocument, type PDFFont, type PDFImage, type PDFPage, type RGB } from 'pdf-lib';

import { MARCA } from '@/shared/brand/marca';
import { formatearBolivianos } from '@/shared/format/moneda';

import { describirUbicacion } from '../domain/entrada';
import type { EntradaPdf, EntradasPdfDocumento } from './entradas-pdf.types';
import { fitFontSize, toWinAnsiText } from './pdf-text';
import { createQrMatrix, forEachDarkModule, QR_QUIET_ZONE } from './qr-matrix';

export const PAGE_SIZE: [number, number] = [420, 595];

const MARGEN_X = 30;
const ANCHO_TEXTO = PAGE_SIZE[0] - MARGEN_X * 2;
const BANDA = { y: 490, alto: 105 };
const LOGO_LADO = 84;
const LOGO_X = PAGE_SIZE[0] - MARGEN_X - LOGO_LADO;
const ANCHO_TEXTO_BANDA = LOGO_X - MARGEN_X - 12;
const COLOR_TEXTO = rgb(0.04, 0.04, 0.05);
const COLOR_SECUNDARIO = rgb(0.42, 0.42, 0.47);
const COLOR_BANDA = rgb(0.02, 0.02, 0.024);
const COLOR_TEXTO_BANDA = rgb(1, 1, 1);
const QR_LADO = 180;
const QR_X = (PAGE_SIZE[0] - QR_LADO) / 2;
const QR_Y = 150;

export interface PdfRecursos {
  regular: PDFFont;
  bold: PDFFont;
  logo: PDFImage | null;
}

interface TextoPdf {
  texto: string;
  y: number;
  size: number;
  font: PDFFont;
  color?: RGB;
  anchoMaximo?: number;
}

function drawTexto(page: PDFPage, { texto, y, size, font, color = COLOR_TEXTO, anchoMaximo = ANCHO_TEXTO }: TextoPdf): void {
  const seguro = toWinAnsiText(texto);
  page.drawText(seguro, { x: MARGEN_X, y, size: fitFontSize(font, seguro, anchoMaximo, size, 8), font, color });
}

function drawBandaMarca(page: PDFPage, recursos: PdfRecursos, documento: EntradasPdfDocumento): void {
  page.drawRectangle({ x: 0, y: BANDA.y, width: PAGE_SIZE[0], height: BANDA.alto, color: COLOR_BANDA });
  if (recursos.logo) {
    page.drawImage(recursos.logo, {
      x: LOGO_X,
      y: BANDA.y + (BANDA.alto - LOGO_LADO) / 2,
      width: LOGO_LADO,
      height: LOGO_LADO,
    });
  }

  const textoBanda = { color: COLOR_TEXTO_BANDA, anchoMaximo: ANCHO_TEXTO_BANDA };
  drawTexto(page, { texto: `ENTRADA / ${documento.zonaNombre.toUpperCase()}`, y: 555, size: 12, font: recursos.bold, ...textoBanda });
  drawTexto(page, { texto: documento.eventoNombre, y: 518, size: 24, font: recursos.bold, ...textoBanda });
}

function drawQr(page: PDFPage, token: string): void {
  const matrix = createQrMatrix(token);
  const totalModulos = matrix.size + QR_QUIET_ZONE * 2;
  const lado = QR_LADO / totalModulos;

  page.drawRectangle({ x: QR_X, y: QR_Y, width: QR_LADO, height: QR_LADO, color: rgb(1, 1, 1) });
  forEachDarkModule(matrix, (row, column) => {
    page.drawRectangle({
      x: QR_X + (column + QR_QUIET_ZONE) * lado,
      y: QR_Y + (totalModulos - 1 - (row + QR_QUIET_ZONE)) * lado,
      width: lado,
      height: lado,
      color: rgb(0, 0, 0),
    });
  });
}

export function drawEntradaPage(
  pdf: PDFDocument,
  recursos: PdfRecursos,
  documento: EntradasPdfDocumento,
  entrada: EntradaPdf,
): void {
  const page = pdf.addPage(PAGE_SIZE);
  const { regular, bold } = recursos;

  drawBandaMarca(page, recursos, documento);

  drawTexto(page, { texto: 'Cliente', y: 459, size: 10, font: regular, color: COLOR_SECUNDARIO });
  drawTexto(page, { texto: documento.clienteNombre, y: 434, size: 18, font: bold });
  drawTexto(page, { texto: `Entrada n.º ${entrada.codigo}`, y: 404, size: 13, font: bold });

  const ubicacion = describirUbicacion(entrada.ubicacion);
  if (ubicacion) {
    drawTexto(page, { texto: ubicacion.replace('·', '/'), y: 384, size: 13, font: bold });
  }
  drawTexto(page, {
    texto: `${formatearBolivianos(documento.precioUnitarioCentavos)} / Pagado (${documento.metodoPagoEtiqueta})`,
    y: ubicacion ? 364 : 384,
    size: 11,
    font: regular,
  });

  drawQr(page, entrada.qrToken);

  drawTexto(page, { texto: 'Presenta este QR en la puerta. Válido para un solo ingreso.', y: 118, size: 10, font: regular });
  drawTexto(page, { texto: MARCA.nombre, y: 40, size: 9, font: regular, color: COLOR_SECUNDARIO });
}
