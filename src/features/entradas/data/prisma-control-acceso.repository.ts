import type { Prisma, PrismaClient } from '@/generated/prisma/client';

import type { EntradaControl } from '../domain/control-acceso';
import type { ControlAccesoRepository } from '../domain/control-acceso.repository';

const entradaControlSelect = {
  id: true,
  codigo: true,
  estado: true,
  usadaEn: true,
  zona: { select: { nombre: true, evento: { select: { nombre: true } } } },
  asiento: { select: { mesa: true, silla: true } },
  venta: { select: { clienteNombre: true } },
} satisfies Prisma.EntradaSelect;

type EntradaControlRecord = Prisma.EntradaGetPayload<{ select: typeof entradaControlSelect }>;

function toEntradaControl(record: EntradaControlRecord): EntradaControl {
  return {
    id: record.id,
    codigo: record.codigo,
    estado: record.estado,
    eventoNombre: record.zona.evento.nombre,
    zonaNombre: record.zona.nombre,
    ubicacion: record.asiento ? { mesa: record.asiento.mesa, silla: record.asiento.silla } : null,
    clienteNombre: record.venta.clienteNombre,
    usadaEn: record.usadaEn,
  };
}

export class PrismaControlAccesoRepository implements ControlAccesoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async buscarPorId(entradaId: string): Promise<EntradaControl | null> {
    const entrada = await this.prisma.entrada.findUnique({ where: { id: entradaId }, select: entradaControlSelect });
    return entrada ? toEntradaControl(entrada) : null;
  }

  async buscarPorCodigo(codigo: string): Promise<EntradaControl | null> {
    const entrada = await this.prisma.entrada.findUnique({ where: { codigo }, select: entradaControlSelect });
    return entrada ? toEntradaControl(entrada) : null;
  }

  async registrarIngreso(entradaId: string, validadorId: string, fecha: Date): Promise<boolean> {
    const { count } = await this.prisma.entrada.updateMany({
      where: { id: entradaId, estado: 'VALIDA' },
      data: { estado: 'USADA', usadaEn: fecha, validadaPorId: validadorId },
    });
    return count === 1;
  }
}
