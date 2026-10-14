import { PDFDocument, StandardFonts, type PDFImage } from 'pdf-lib';

import { MARCA } from '@/shared/brand/marca';

import { drawEntradaPage } from './draw-entrada-page';
import type { EntradasPdfDocumento } from './entradas-pdf.types';

export type LogoPngLoader = () => Promise<Uint8Array | null>;

export class EntradasPdfRenderer {
  constructor(private readonly cargarLogo: LogoPngLoader = async () => null) {}

  async render(documento: EntradasPdfDocumento): Promise<Uint8Array> {
    const pdf = await PDFDocument.create();
    pdf.setTitle(`Entradas · ${documento.eventoNombre}`);
    pdf.setProducer(MARCA.nombre);

    const recursos = {
      regular: await pdf.embedFont(StandardFonts.Helvetica),
      bold: await pdf.embedFont(StandardFonts.HelveticaBold),
      logo: await this.incrustarLogo(pdf),
    };

    for (const entrada of documento.entradas) {
      drawEntradaPage(pdf, recursos, documento, entrada);
    }

    return pdf.save();
  }

  private async incrustarLogo(pdf: PDFDocument): Promise<PDFImage | null> {
    const logo = await this.cargarLogo();
    return logo ? pdf.embedPng(logo) : null;
  }
}
