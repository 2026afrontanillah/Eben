import { describe, expect, it } from 'vitest';

import { resolveSafeRedirect } from './safe-redirect';

describe('resolveSafeRedirect', () => {
  it.each(['/ventas', '/eventos/abc?x=1'])('acepta rutas internas: %s', (destino) => {
    expect(resolveSafeRedirect(destino)).toBe(destino);
  });

  it.each(['https://evil.com', '//evil.com', '/\\evil.com', ''])('rechaza destinos externos: %s', (destino) => {
    expect(resolveSafeRedirect(destino)).toBe('/');
  });
});
