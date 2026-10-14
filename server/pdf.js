import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import fs from 'node:fs';
import path from 'node:path';

export const PAGE_SIZE = [420, 595];
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

function formatearBs(centavos) {
  if (centavos == null) return 'Bs 0';
  return `Bs ${(centavos / 100).toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

let cachedLogoBytes = null;
function getLogoBytes() {
  if (cachedLogoBytes === null) {
    const logoPath = path.join(process.cwd(), 'public', 'brand', 'eben-logo.png');
    if (fs.existsSync(logoPath)) {
      cachedLogoBytes = fs.readFileSync(logoPath);
    } else {
      cachedLogoBytes = false;
    }
  }
  return cachedLogoBytes || null;
}

export async function renderEntradasPdf({
  eventoNombre,
  zonaNombre,
  clienteNombre,
  precioUnitarioCentavos,
  metodoPagoEtiqueta,
  entradas, // array of { codigo, qrToken, ubicacion }
}) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Entradas · ${eventoNombre}`);
  pdf.setProducer('!eben Producciones');

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const logoBytes = getLogoBytes();
  let logoImage = null;
  if (logoBytes) {
    try {
      logoImage = await pdf.embedPng(logoBytes);
    } catch {
      // Ignorar si el png no se puede incrustar
    }
  }

  for (const entrada of entradas) {
    const page = pdf.addPage(PAGE_SIZE);

    // Banda negra superior
    page.drawRectangle({
      x: 0,
      y: BANDA.y,
      width: PAGE_SIZE[0],
      height: BANDA.alto,
      color: COLOR_BANDA,
    });

    if (logoImage) {
      page.drawImage(logoImage, {
        x: LOGO_X,
        y: BANDA.y + (BANDA.alto - LOGO_LADO) / 2,
        width: LOGO_LADO,
        height: LOGO_LADO,
      });
    }

    // Texto banda
    page.drawText(`ENTRADA / ${zonaNombre.toUpperCase()}`, {
      x: MARGEN_X,
      y: 555,
      size: 11,
      font: bold,
      color: COLOR_TEXTO_BANDA,
    });

    const safeEvento = eventoNombre.length > 25 ? eventoNombre.slice(0, 25) + '...' : eventoNombre;
    page.drawText(safeEvento, {
      x: MARGEN_X,
      y: 518,
      size: 22,
      font: bold,
      color: COLOR_TEXTO_BANDA,
    });

    // Datos del cliente y entrada
    page.drawText('Cliente', {
      x: MARGEN_X,
      y: 459,
      size: 10,
      font: regular,
      color: COLOR_SECUNDARIO,
    });

    const safeCliente = clienteNombre.length > 35 ? clienteNombre.slice(0, 35) + '...' : clienteNombre;
    page.drawText(safeCliente, {
      x: MARGEN_X,
      y: 434,
      size: 18,
      font: bold,
      color: COLOR_TEXTO,
    });

    page.drawText(`Entrada n.º ${entrada.codigo}`, {
      x: MARGEN_X,
      y: 404,
      size: 13,
      font: bold,
      color: COLOR_TEXTO,
    });

    let currentY = 384;
    if (entrada.ubicacion) {
      page.drawText(entrada.ubicacion.replace('·', '/'), {
        x: MARGEN_X,
        y: currentY,
        size: 13,
        font: bold,
        color: COLOR_TEXTO,
      });
      currentY -= 20;
    }

    page.drawText(
      `${formatearBs(precioUnitarioCentavos)} / Pagado (${metodoPagoEtiqueta || 'Registrado'})`,
      {
        x: MARGEN_X,
        y: currentY,
        size: 11,
        font: regular,
        color: COLOR_TEXTO,
      }
    );

    // Código QR
    try {
      const qrDataUrl = await QRCode.toDataURL(entrada.qrToken, {
        margin: 1,
        errorCorrectionLevel: 'M',
      });
      const qrBase64 = qrDataUrl.split(',')[1];
      const qrImage = await pdf.embedPng(Buffer.from(qrBase64, 'base64'));

      page.drawRectangle({
        x: QR_X - 10,
        y: QR_Y - 10,
        width: QR_LADO + 20,
        height: QR_LADO + 20,
        color: rgb(1, 1, 1),
      });

      page.drawImage(qrImage, {
        x: QR_X,
        y: QR_Y,
        width: QR_LADO,
        height: QR_LADO,
      });
    } catch (err) {
      console.error('Error al generar QR en PDF:', err);
    }

    // Pie
    page.drawText('Presenta este QR en la puerta. Válido para un solo ingreso.', {
      x: MARGEN_X,
      y: 118,
      size: 10,
      font: regular,
      color: COLOR_TEXTO,
    });

    page.drawText('!eben Producciones', {
      x: MARGEN_X,
      y: 40,
      size: 9,
      font: regular,
      color: COLOR_SECUNDARIO,
    });
  }

  return pdf.save();
}
