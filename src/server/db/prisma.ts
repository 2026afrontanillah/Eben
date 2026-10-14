import 'server-only';

import type { PrismaClient } from '@/generated/prisma/client';
import { getEnv } from '@/server/config/env';

import { createPrismaClient } from './create-prisma-client';

const globalForPrisma = globalThis as unknown as { relaPrisma?: PrismaClient };

/** Reutiliza el pool entre recargas en desarrollo para no agotar las conexiones de PostgreSQL. */
export function getPrisma(): PrismaClient {
  globalForPrisma.relaPrisma ??= createPrismaClient(getEnv().DATABASE_URL);
  return globalForPrisma.relaPrisma;
}
