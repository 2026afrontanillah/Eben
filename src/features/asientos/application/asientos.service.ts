import type { AsientosRepository } from '../domain/asientos.repository';
import { agruparEnMesas, type MesaEstado } from '../domain/mesa';

export class AsientosService {
  constructor(private readonly asientos: AsientosRepository) {}

  async obtenerMesas(zonaId: string): Promise<MesaEstado[]> {
    return agruparEnMesas(await this.asientos.listarPorZona(zonaId));
  }
}
