import { z } from 'zod';

import { METODOS_PAGO, requiereReferencia, type MetodoPago } from '../domain/metodo-pago';
import { LONGITUD_MINIMA_MOTIVO_ANULACION, MAX_ENTRADAS_POR_VENTA } from '../domain/reglas-venta';
import type { DatosCliente, DatosPago } from '../domain/venta';

const emailSchema = z.email();

const camposCliente = {
  clienteNombre: z.string().trim().min(3, 'Ingresa nombre y apellido.').max(100, 'Máximo 100 caracteres.'),
  clienteCelular: z
    .string()
    .trim()
    .max(30, 'Máximo 30 caracteres.')
    .refine((celular) => celular.replace(/\D/g, '').length >= 7, 'Ingresa un celular válido (mínimo 7 dígitos).'),
  clienteEmail: z
    .string()
    .trim()
    .toLowerCase()
    .max(150, 'Máximo 150 caracteres.')
    .refine((email) => email === '' || emailSchema.safeParse(email).success, 'Ingresa un email válido o déjalo vacío.'),
};

const camposPago = {
  metodoPago: z.enum(METODOS_PAGO, { error: 'Elige el método de pago.' }),
  referenciaPago: z.string().trim().max(100, 'Máximo 100 caracteres.'),
};

interface CamposPago {
  metodoPago: MetodoPago;
  referenciaPago: string;
}

interface RefinementContext {
  addIssue(issue: { code: 'custom'; path: string[]; message: string }): void;
}

function exigirReferenciaSiCorresponde(datos: CamposPago, context: RefinementContext): void {
  if (requiereReferencia(datos.metodoPago) && datos.referenciaPago === '') {
    context.addIssue({
      code: 'custom',
      path: ['referenciaPago'],
      message: 'Ingresa el número de comprobante del pago.',
    });
  }
}

const cantidadSchema = z.coerce
  .number({ error: 'Ingresa la cantidad.' })
  .int('La cantidad debe ser un número entero.')
  .min(1, 'Mínimo 1 entrada.')
  .max(MAX_ENTRADAS_POR_VENTA, `Máximo ${MAX_ENTRADAS_POR_VENTA} entradas por venta.`);

export const ventaGeneralSchema = z
  .object({
    eventoId: z.uuid(),
    zonaId: z.uuid(),
    cantidad: cantidadSchema,
    ...camposCliente,
    ...camposPago,
  })
  .superRefine(exigirReferenciaSiCorresponde);

export const ventaAsientosSchema = z
  .object({
    eventoId: z.uuid(),
    zonaId: z.uuid(),
    mesa: z.coerce.number().int().min(1),
    sillas: z
      .array(z.coerce.number().int().min(1))
      .min(1, 'Selecciona al menos una silla.')
      .max(MAX_ENTRADAS_POR_VENTA, `Máximo ${MAX_ENTRADAS_POR_VENTA} sillas por venta.`),
    ...camposCliente,
    ...camposPago,
  })
  .superRefine(exigirReferenciaSiCorresponde);

export const anularVentaSchema = z.object({
  ventaId: z.uuid(),
  motivo: z
    .string()
    .trim()
    .min(LONGITUD_MINIMA_MOTIVO_ANULACION, 'Explica el motivo de la anulación.')
    .max(300, 'Máximo 300 caracteres.'),
});

interface CamposCliente {
  clienteNombre: string;
  clienteCelular: string;
  clienteEmail: string;
}

export function toDatosCliente(datos: CamposCliente): DatosCliente {
  return {
    nombre: datos.clienteNombre,
    celular: datos.clienteCelular,
    email: datos.clienteEmail === '' ? null : datos.clienteEmail,
  };
}

export function toDatosPago(datos: CamposPago): DatosPago {
  return { metodo: datos.metodoPago, referencia: datos.referenciaPago === '' ? null : datos.referenciaPago };
}
