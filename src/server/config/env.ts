import 'server-only';

import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  QR_ENTRADAS_SECRET: z.string().min(32, 'QR_ENTRADAS_SECRET debe tener al menos 32 caracteres'),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | undefined;

export function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const detalles = parsed.error.issues.map((issue) => issue.message).join('; ');
    throw new Error(`Variables de entorno inválidas: ${detalles}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
