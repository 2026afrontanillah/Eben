import type { Evento } from './evento';

export interface EventosRepository {
  obtenerActivo(): Promise<Evento | null>;
  obtenerPorId(eventoId: string): Promise<Evento | null>;
}
