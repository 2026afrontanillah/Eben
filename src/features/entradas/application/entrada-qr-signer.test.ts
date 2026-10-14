import { describe, expect, it } from 'vitest';

import { EntradaQrSigner } from './entrada-qr-signer';

const SECRETO = 'secreto-de-prueba-con-mas-de-32-caracteres';
const ENTRADA_ID = '6f1c2a5e-8b3d-4e1f-9a2b-3c4d5e6f7a8b';

describe('EntradaQrSigner', () => {
  const signer = new EntradaQrSigner(SECRETO);

  it('verifica un token firmado y devuelve el id de la entrada', () => {
    const token = signer.sign(ENTRADA_ID);

    expect(token.startsWith('RELA1.')).toBe(true);
    expect(signer.verify(token)).toBe(ENTRADA_ID);
  });

  it('rechaza un token con el id alterado', () => {
    const token = signer.sign(ENTRADA_ID).replace(ENTRADA_ID, '6f1c2a5e-8b3d-4e1f-9a2b-3c4d5e6f7a8c');
    expect(signer.verify(token)).toBeNull();
  });

  it('rechaza un token firmado con otro secreto', () => {
    const tokenAjeno = new EntradaQrSigner('otro-secreto-de-prueba-con-32-caracteres').sign(ENTRADA_ID);
    expect(signer.verify(tokenAjeno)).toBeNull();
  });

  it.each(['', 'RELA1', `RELA1.${ENTRADA_ID}`, `RELA2.${ENTRADA_ID}.firma`, 'RELA1.no-es-uuid.firma'])(
    'rechaza lecturas mal formadas: %s',
    (lectura) => {
      expect(signer.verify(lectura)).toBeNull();
    },
  );

  it('distingue un token de un código manual', () => {
    expect(signer.looksLikeToken(signer.sign(ENTRADA_ID))).toBe(true);
    expect(signer.looksLikeToken('GEN-7K2M9QXA-001')).toBe(false);
  });
});
