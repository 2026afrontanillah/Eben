import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

import type { PasswordHasher } from '../domain/password-hasher';

const ALGORITMO = 'scrypt';
const SALT_BYTES = 16;
const KEY_BYTES = 64;

/** Parámetros recomendados por OWASP para scrypt (N=2^15, r=8, p=3). */
const PARAMETROS_POR_DEFECTO: ScryptParameters = { cost: 2 ** 15, blockSize: 8, parallelization: 3 };

interface ScryptParameters {
  cost: number;
  blockSize: number;
  parallelization: number;
}

interface StoredHash extends ScryptParameters {
  salt: Buffer;
  key: Buffer;
}

function deriveKey(password: string, salt: Buffer, keyLength: number, parameters: ScryptParameters): Promise<Buffer> {
  const { cost, blockSize, parallelization } = parameters;
  const maxmem = 256 * cost * blockSize;

  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, { N: cost, r: blockSize, p: parallelization, maxmem }, (error, key) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(key);
    });
  });
}

function parseStoredHash(storedHash: string): StoredHash | null {
  const [algoritmo, cost, blockSize, parallelization, salt, key] = storedHash.split('$');
  if (algoritmo !== ALGORITMO || !cost || !blockSize || !parallelization || !salt || !key) {
    return null;
  }

  return {
    cost: Number(cost),
    blockSize: Number(blockSize),
    parallelization: Number(parallelization),
    salt: Buffer.from(salt, 'base64url'),
    key: Buffer.from(key, 'base64url'),
  };
}

export class ScryptPasswordHasher implements PasswordHasher {
  constructor(private readonly parameters: ScryptParameters = PARAMETROS_POR_DEFECTO) {}

  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_BYTES);
    const key = await deriveKey(password, salt, KEY_BYTES, this.parameters);
    const { cost, blockSize, parallelization } = this.parameters;

    return [ALGORITMO, cost, blockSize, parallelization, salt.toString('base64url'), key.toString('base64url')].join('$');
  }

  async verify(password: string, storedHash: string): Promise<boolean> {
    const parsed = parseStoredHash(storedHash);
    if (!parsed) {
      return false;
    }

    const key = await deriveKey(password, parsed.salt, parsed.key.length, parsed);
    return timingSafeEqual(key, parsed.key);
  }
}
