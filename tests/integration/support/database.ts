import type { PrismaClient } from '@/generated/prisma/client';
import { createPrismaClient } from '@/server/db/create-prisma-client';

const TABLAS = ['entradas', 'pagos', 'ventas', 'asientos', 'zonas', 'eventos', 'sesiones', 'usuarios'];

export function createTestPrisma(): PrismaClient {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error('TEST_DATABASE_URL no está definida.');
  }
  return createPrismaClient(url);
}

export async function limpiarBaseDeDatos(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${TABLAS.map((tabla) => `"${tabla}"`).join(', ')} CASCADE`);
}
