import { ZonaNoEncontradaError } from '../domain/eventos.errors';
import type { ZonasRepository } from '../domain/zonas.repository';

export interface ConfiguracionZonaSolicitud {
  zonaId: string;
  precioCentavos: number | null;
  habilitada: boolean;
}

export class ConfigurarZonaUseCase {
  constructor(private readonly zonas: ZonasRepository) {}

  async ejecutar(solicitud: ConfiguracionZonaSolicitud): Promise<void> {
    const zona = await this.zonas.obtenerPorId(solicitud.zonaId);
    if (!zona) {
      throw new ZonaNoEncontradaError();
    }

    await this.zonas.actualizarConfiguracion(zona.id, {
      precioCentavos: solicitud.precioCentavos,
      habilitada: solicitud.habilitada,
    });
  }
}
