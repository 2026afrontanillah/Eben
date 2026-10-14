import type { PDFFont } from 'pdf-lib';

const CARACTERES_EXTRA_WIN_ANSI = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ');

function esCaracterWinAnsi(caracter: string): boolean {
  const codePoint = caracter.codePointAt(0) ?? 0;
  const esImprimibleBasico = codePoint >= 0x20 && codePoint <= 0x7e;
  const esLatin1 = codePoint >= 0xa0 && codePoint <= 0xff;
  return esImprimibleBasico || esLatin1 || CARACTERES_EXTRA_WIN_ANSI.has(caracter);
}

/** Las fuentes estándar del PDF solo codifican WinAnsi; otros caracteres (emojis, etc.) romperían el render. */
export function toWinAnsiText(texto: string): string {
  return Array.from(texto, (caracter) => (esCaracterWinAnsi(caracter) ? caracter : '?')).join('');
}

export function fitFontSize(font: PDFFont, texto: string, maxWidth: number, maxSize: number, minSize: number): number {
  let size = maxSize;
  while (size > minSize && font.widthOfTextAtSize(texto, size) > maxWidth) {
    size -= 1;
  }
  return size;
}
