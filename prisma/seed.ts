import { ScryptPasswordHasher } from '../src/features/auth/data/scrypt-password-hasher';
import type { PrismaClient } from '../src/generated/prisma/client';
import { createPrismaClient } from '../src/server/db/create-prisma-client';
import { EVENTO_KJARKAS_55, ZONAS_KJARKAS_55, type ZonaSemilla } from './seed-data/kjarkas-55';

function requireEnv(nombre: string): string {
  const valor = process.env[nombre]?.trim();
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre} para ejecutar el seed.`);
  }
  return valor;
}

async function sembrarEvento(prisma: PrismaClient): Promise<string> {
  const evento = await prisma.evento.upsert({
    where: { slug: EVENTO_KJARKAS_55.slug },
    create: { ...EVENTO_KJARKAS_55, activo: true },
    update: { nombre: EVENTO_KJARKAS_55.nombre },
  });
  return evento.id;
}

async function sembrarZona(prisma: PrismaClient, eventoId: string, zona: ZonaSemilla): Promise<void> {
  const { mesas = null, sillasPorMesa = null, mesasPorFila = null, ...datos } = zona;
  // En una re-ejecución solo se actualiza la presentación; precio, stock y habilitación los gestiona el admin.
  const registro = await prisma.zona.upsert({
    where: { eventoId_codigo: { eventoId, codigo: zona.codigo } },
    create: { ...datos, eventoId, disponibles: zona.capacidad, mesas, sillasPorMesa, mesasPorFila },
    update: { nombre: zona.nombre, areaPlano: zona.areaPlano, color: zona.color, orden: zona.orden },
  });

  if (mesas === null || sillasPorMesa === null) {
    return;
  }

  const asientos = Array.from({ length: mesas }, (_, indiceMesa) =>
    Array.from({ length: sillasPorMesa }, (__, indiceSilla) => ({
      zonaId: registro.id,
      mesa: indiceMesa + 1,
      silla: indiceSilla + 1,
    })),
  ).flat();
  await prisma.asiento.createMany({ data: asientos, skipDuplicates: true });
}

async function sembrarAdministrador(prisma: PrismaClient): Promise<string> {
  const email = requireEnv('SEED_ADMIN_EMAIL').toLowerCase();
  const existente = await prisma.usuario.findUnique({ where: { email }, select: { id: true } });
  if (existente) {
    return `${email} (ya existía, contraseña sin cambios)`;
  }

  const passwordHash = await new ScryptPasswordHasher().hash(requireEnv('SEED_ADMIN_PASSWORD'));
  await prisma.usuario.create({
    data: { email, passwordHash, nombre: process.env.SEED_ADMIN_NOMBRE?.trim() || 'Administrador', rol: 'ADMIN' },
  });
  return `${email} (creado)`;
}

async function main(): Promise<void> {
  const prisma = createPrismaClient(requireEnv('DATABASE_URL'));
  try {
    const eventoId = await sembrarEvento(prisma);
    for (const zona of ZONAS_KJARKAS_55) {
      await sembrarZona(prisma, eventoId, zona);
    }
    const administrador = await sembrarAdministrador(prisma);
    console.warn(`Seed completo: evento "${EVENTO_KJARKAS_55.nombre}", ${ZONAS_KJARKAS_55.length} zonas, admin ${administrador}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('El seed falló:', error);
  process.exitCode = 1;
});
