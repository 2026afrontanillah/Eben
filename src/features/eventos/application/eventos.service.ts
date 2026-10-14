import { isUuid } from '@/shared/validation/uuid';

import type { Evento } from '../domain/evento';
import { EventoNoEncontradoError, ZonaNoEncontradaError } from '../domain/eventos.errors';
import type { EventosRepository } from '../domain/eventos.repository';
import type { Zona } from '../domain/zona';
import type { ZonasRepository } from '../domain/zonas.repository';

export interface MapaEvento {
  evento: Evento;
  zonas: Zona[];
}

export interface ZonaDeEvento {
  evento: Evento;
  zona: Zona;
}

export class EventosService {
  constructor(
    private readonly eventos: EventosRepository,
    private readonly zonas: ZonasRepository,
  ) {}

  obtenerEventoActivo(): Promise<Evento | null> {
    return this.eventos.obtenerActivo();
  }

  async obtenerMapa(eventoId: string): Promise<MapaEvento> {
    const evento = await this.obtenerEvento(eventoId);
    const zonas = await this.zonas.listarPorEvento(evento.id);
    return { evento, zonas };
  }

  async obtenerZona(eventoId: string, zonaId: string): Promise<ZonaDeEvento> {
    const evento = await this.obtenerEvento(eventoId);
    const zona = isUuid(zonaId) ? await this.zonas.obtenerPorId(zonaId) : null;
    if (!zona || zona.eventoId !== evento.id) {
      throw new ZonaNoEncontradaError();
    }
    return { evento, zona };
  }

  private async obtenerEvento(eventoId: string): Promise<Evento> {
    const evento = isUuid(eventoId) ? await this.eventos.obtenerPorId(eventoId) : null;
    if (!evento) {
      throw new EventoNoEncontradoError();
    }
    return evento;
  }
}
