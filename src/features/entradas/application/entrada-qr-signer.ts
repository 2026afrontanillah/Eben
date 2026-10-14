import { createHmac, timingSafeEqual } from 'node:crypto';

const PREFIJO_TOKEN = 'RELA1';
const LONGITUD_FIRMA = 22;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Firma el id de la entrada con HMAC para que en puerta se detecten QR fabricados
 * antes de consultar la base de datos.
 */
export class EntradaQrSigner {
  constructor(private readonly secret: string) {}

  sign(entradaId: string): string {
    return [PREFIJO_TOKEN, entradaId, this.firmar(entradaId)].join('.');
  }

  /** Devuelve el id de la entrada si la firma es válida; `null` en cualquier otro caso. */
  verify(token: string): string | null {
    const [prefijo, entradaId, firma, ...resto] = token.trim().split('.');
    if (prefijo !== PREFIJO_TOKEN || !entradaId || !firma || resto.length > 0 || !UUID_PATTERN.test(entradaId)) {
      return null;
    }

    const esperada = Buffer.from(this.firmar(entradaId));
    const recibida = Buffer.from(firma);
    if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) {
      return null;
    }

    return entradaId.toLowerCase();
  }

  looksLikeToken(lectura: string): boolean {
    return lectura.trim().startsWith(`${PREFIJO_TOKEN}.`);
  }

  private firmar(entradaId: string): string {
    return createHmac('sha256', this.secret).update(entradaId.toLowerCase()).digest('base64url').slice(0, LONGITUD_FIRMA);
  }
}
