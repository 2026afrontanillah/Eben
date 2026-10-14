import { describe, expect, it } from 'vitest';

import { toWinAnsiText } from './pdf-text';

describe('toWinAnsiText', () => {
  it('conserva acentos, eñes y símbolos del español', () => {
    expect(toWinAnsiText('Gradería · Ñandú – ¿Sí? €')).toBe('Gradería · Ñandú – ¿Sí? €');
  });

  it('reemplaza emojis y escrituras no latinas', () => {
    expect(toWinAnsiText('Ana 🎶 李')).toBe('Ana ? ?');
  });
});
