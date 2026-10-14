import crypto from 'node:crypto';

const PREFIJO_TOKEN = 'RELA1';
const LONGITUD_FIRMA = 22;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CROCKFORD_BASE32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

const SECRET = process.env.QR_ENTRADAS_SECRET || 'x8K2vM9pL4wQ7zR1tY6uI3oP5aS0dF8gH2jK4lZ7xV9bN1mC3vB5n';

export function signQrToken(entradaId) {
  const id = entradaId.toLowerCase();
  const firma = crypto.createHmac('sha256', SECRET).update(id).digest('base64url').slice(0, LONGITUD_FIRMA);
  return `${PREFIJO_TOKEN}.${id}.${firma}`;
}

export function verifyQrToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.trim().split('.');
  if (parts.length !== 3) return null;

  const [prefijo, entradaId, firma] = parts;
  if (prefijo !== PREFIJO_TOKEN || !entradaId || !firma || !UUID_PATTERN.test(entradaId) || firma.length !== LONGITUD_FIRMA) {
    return null;
  }

  const expectedFirma = crypto.createHmac('sha256', SECRET).update(entradaId.toLowerCase()).digest('base64url').slice(0, LONGITUD_FIRMA);
  const bufExpected = Buffer.from(expectedFirma);
  const bufReceived = Buffer.from(firma);

  if (bufExpected.length !== bufReceived.length || !crypto.timingSafeEqual(bufExpected, bufReceived)) {
    return null;
  }

  return entradaId.toLowerCase();
}

export function looksLikeToken(lectura) {
  return typeof lectura === 'string' && lectura.trim().startsWith(`${PREFIJO_TOKEN}.`);
}

export function generateRandomCode(length = 6) {
  let code = '';
  for (let index = 0; index < length; index += 1) {
    code += CROCKFORD_BASE32.charAt(crypto.randomInt(CROCKFORD_BASE32.length));
  }
  return code;
}
