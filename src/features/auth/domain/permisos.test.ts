import { describe, expect, it } from 'vitest';

import { PERMISOS, tienePermiso } from './permisos';

describe('tienePermiso', () => {
  it('el administrador tiene todos los permisos', () => {
    expect(PERMISOS.every((permiso) => tienePermiso('ADMIN', permiso))).toBe(true);
  });

  it('vendedores y relacionadores solo pueden vender', () => {
    for (const rol of ['VENDEDOR', 'RELACIONADOR'] as const) {
      expect(PERMISOS.filter((permiso) => tienePermiso(rol, permiso))).toEqual(['VENDER']);
    }
  });

  it('control de acceso solo valida entradas', () => {
    expect(PERMISOS.filter((permiso) => tienePermiso('CONTROL', permiso))).toEqual(['VALIDAR_ENTRADAS']);
  });
});
