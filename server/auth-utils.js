import crypto from 'node:crypto';

const ALGORITMO = 'scrypt';
const SALT_BYTES = 16;
const KEY_BYTES = 64;
const COST = 32768; // 2^15
const BLOCK_SIZE = 8;
const PARALLELIZATION = 3;

export function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_BYTES);
  const maxmem = 256 * COST * BLOCK_SIZE;
  const key = crypto.scryptSync(password, salt, KEY_BYTES, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELIZATION,
    maxmem,
  });

  return [
    ALGORITMO,
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
    salt.toString('base64url'),
    key.toString('base64url'),
  ].join('$');
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false;
  const parts = storedHash.split('$');
  if (parts.length !== 6 || parts[0] !== ALGORITMO) return false;

  const [, costStr, rStr, pStr, saltStr, keyStr] = parts;
  const cost = Number(costStr);
  const r = Number(rStr);
  const p = Number(pStr);
  const salt = Buffer.from(saltStr, 'base64url');
  const expectedKey = Buffer.from(keyStr, 'base64url');
  const maxmem = 256 * cost * r;

  try {
    const derivedKey = crypto.scryptSync(password, salt, expectedKey.length, {
      N: cost,
      r,
      p,
      maxmem,
    });
    return crypto.timingSafeEqual(derivedKey, expectedKey);
  } catch {
    return false;
  }
}

export function createSessionToken() {
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
}

export function hashSessionToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
