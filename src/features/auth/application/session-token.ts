import { createHash, randomBytes } from 'node:crypto';

export interface SessionToken {
  token: string;
  tokenHash: string;
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createSessionToken(): SessionToken {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashSessionToken(token) };
}
