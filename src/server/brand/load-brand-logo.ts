import 'server-only';

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { MARCA } from '@/shared/brand/marca';
import { logger } from '@/shared/logging/logger';

let logoCache: Promise<Uint8Array | null> | undefined;

/** Si el archivo no está disponible el PDF se genera igual, solo que sin logo. */
export function loadBrandLogoPng(): Promise<Uint8Array | null> {
  logoCache ??= readFile(path.join(process.cwd(), 'public', MARCA.logo.src)).catch((error: unknown) => {
    logger.error('loadBrandLogoPng', error);
    logoCache = undefined;
    return null;
  });
  return logoCache;
}
