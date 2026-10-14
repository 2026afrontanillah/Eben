import { describe, expect, it } from 'vitest';

import { toDatosCliente, toDatosPago, ventaGeneralSchema } from './venta.schemas';

const base = {
  eventoId: '11111111-1111-4111-8111-111111111111',
  zonaId: '22222222-2222-4222-8222-222222222222',
  cantidad: '2',
  clienteNombre: 'Juan Pérez',
  clienteCelular: '+591 700 12345',
  clienteEmail: '',
  metodoPago: 'EFECTIVO',
  referenciaPago: '',
};

describe('ventaGeneralSchema', () => {
  it('acepta efectivo sin referencia y deja el email como nulo', () => {
    const datos = ventaGeneralSchema.parse(base);

    expect(datos.cantidad).toBe(2);
    expect(toDatosCliente(datos)).toEqual({ nombre: 'Juan Pérez', celular: '+591 700 12345', email: null });
    expect(toDatosPago(datos)).toEqual({ metodo: 'EFECTIVO', referencia: null });
  });

  it.each(['QR', 'TRANSFERENCIA'])('exige número de comprobante para %s', (metodoPago) => {
    const resultado = ventaGeneralSchema.safeParse({ ...base, metodoPago });

    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0]?.path).toEqual(['referenciaPago']);
  });

  it('rechaza un celular con menos de 7 dígitos', () => {
    expect(ventaGeneralSchema.safeParse({ ...base, clienteCelular: '12-34' }).success).toBe(false);
  });

  it('rechaza un email mal escrito pero normaliza uno válido', () => {
    expect(ventaGeneralSchema.safeParse({ ...base, clienteEmail: 'juan@' }).success).toBe(false);
    expect(ventaGeneralSchema.parse({ ...base, clienteEmail: ' Juan@Mail.com ' }).clienteEmail).toBe('juan@mail.com');
  });

  it('rechaza métodos de pago desconocidos', () => {
    expect(ventaGeneralSchema.safeParse({ ...base, metodoPago: 'CRIPTO' }).success).toBe(false);
  });
});
