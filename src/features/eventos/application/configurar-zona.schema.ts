import { z } from 'zod';

const PRECIO_MAXIMO_BOLIVIANOS = 100_000;

const precioBolivianosSchema = z
  .string()
  .trim()
  .transform((valor) => valor.replace(',', '.'))
  .refine((valor) => valor === '' || /^\d+(\.\d{1,2})?$/.test(valor), 'Usa un monto como 100 o 75.50.')
  .transform((valor) => (valor === '' ? null : Math.round(Number(valor) * 100)))
  .refine(
    (centavos) => centavos === null || (centavos > 0 && centavos <= PRECIO_MAXIMO_BOLIVIANOS * 100),
    'El precio debe ser mayor a 0.',
  );

export const configurarZonaSchema = z.object({
  zonaId: z.uuid(),
  precio: precioBolivianosSchema,
  habilitada: z.boolean(),
});

export type ConfigurarZonaInput = z.infer<typeof configurarZonaSchema>;
