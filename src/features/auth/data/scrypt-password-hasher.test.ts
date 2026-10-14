import { describe, expect, it } from 'vitest';

import { ScryptPasswordHasher } from './scrypt-password-hasher';

const hasherRapido = new ScryptPasswordHasher({ cost: 2 ** 10, blockSize: 8, parallelization: 1 });

describe('ScryptPasswordHasher', () => {
  it('verifica la contraseña correcta y rechaza una distinta', async () => {
    const hash = await hasherRapido.hash('clave-segura-123');

    await expect(hasherRapido.verify('clave-segura-123', hash)).resolves.toBe(true);
    await expect(hasherRapido.verify('clave-segura-124', hash)).resolves.toBe(false);
  });

  it('genera un hash distinto en cada llamada por la sal aleatoria', async () => {
    const [primero, segundo] = await Promise.all([hasherRapido.hash('misma'), hasherRapido.hash('misma')]);
    expect(primero).not.toBe(segundo);
  });

  it('rechaza hashes con formato desconocido', async () => {
    await expect(hasherRapido.verify('clave', 'md5$abc')).resolves.toBe(false);
  });

  it('usa los parámetros por defecto de OWASP', async () => {
    const hash = await new ScryptPasswordHasher().hash('clave');
    expect(hash.startsWith('scrypt$32768$8$3$')).toBe(true);
  });
});
