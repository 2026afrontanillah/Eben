import type { EstadoAsiento } from './mesa';

export interface AsientosRepository {
  listarPorZona(zonaId: string): Promise<EstadoAsiento[]>;
}
