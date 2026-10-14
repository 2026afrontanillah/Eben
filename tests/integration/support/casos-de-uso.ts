import { PrismaZonasRepository } from '@/features/eventos/data/prisma-zonas.repository';
import { AnularVentaUseCase } from '@/features/ventas/application/anular-venta.use-case';
import { VenderAsientosUseCase } from '@/features/ventas/application/vender-asientos.use-case';
import { VenderEntradasGeneralesUseCase } from '@/features/ventas/application/vender-entradas-generales.use-case';
import { PrismaAnulacionVentasRepository } from '@/features/ventas/data/prisma-anulacion-ventas.repository';
import { PrismaRegistroVentasRepository } from '@/features/ventas/data/prisma-registro-ventas.repository';
import type { PrismaClient } from '@/generated/prisma/client';
import { generateRandomCode } from '@/shared/crypto/random-code';

export function crearCasosDeUso(prisma: PrismaClient) {
  const zonas = new PrismaZonasRepository(prisma);
  const registro = new PrismaRegistroVentasRepository(prisma);
  const generarSufijo = () => generateRandomCode(8);

  return {
    venderGenerales: new VenderEntradasGeneralesUseCase(zonas, registro, generarSufijo),
    venderAsientos: new VenderAsientosUseCase(zonas, registro, generarSufijo),
    anularVenta: new AnularVentaUseCase(new PrismaAnulacionVentasRepository(prisma)),
  };
}

export const CLIENTE = { nombre: 'Cliente de prueba', celular: '70012345', email: null };
export const PAGO = { metodo: 'EFECTIVO' as const, referencia: null };
