import { randomInt } from 'node:crypto';

const CROCKFORD_BASE32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function generateRandomCode(length: number): string {
  let code = '';
  for (let index = 0; index < length; index += 1) {
    code += CROCKFORD_BASE32.charAt(randomInt(CROCKFORD_BASE32.length));
  }
  return code;
}
