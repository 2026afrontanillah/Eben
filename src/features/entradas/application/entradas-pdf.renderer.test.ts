import { readFile } from 'node:fs/promises';

import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';

import { EntradasPdfRenderer } from './entradas-pdf.renderer';
import type { EntradasPdfDocumento } from './entradas-pdf.types';

const documentoDePrueba: EntradasPdfDocumento = {
  eventoNombre: 'Kjarkas 55 años',
  zonaNombre: 'VIP grande',
  clienteNombre: 'María José Ñuflo 🎶',
  precioUnitarioCentavos: 10_000,
  metodoPagoEtiqueta: 'Efectivo',
  entradas: [
    { codigo: 'VIP-M1-S1-ABCD2345', qrToken: 'RELA1.token.firma', ubicacion: { mesa: 1, silla: 1 } },
    { codigo: 'VIP-M1-S2-ABCD2345', qrToken: 'RELA1.token.firma2', ubicacion: { mesa: 1, silla: 2 } },
  ],
};

describe('EntradasPdfRenderer', () => {
  it('genera una página por entrada aunque el nombre tenga caracteres no imprimibles en PDF', async () => {
    const bytes = await new EntradasPdfRenderer().render(documentoDePrueba);

    expect(Buffer.from(bytes.subarray(0, 5)).toString()).toBe('%PDF-');
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(2);
  });

  it('incrusta el logo de la marca cuando está disponible', async () => {
    const logo = await readFile('public/brand/eben-logo.png');
    const sinLogo = await new EntradasPdfRenderer().render(documentoDePrueba);
    const conLogo = await new EntradasPdfRenderer(async () => logo).render(documentoDePrueba);

    expect(conLogo.length).toBeGreaterThan(sinLogo.length);
  });
});
