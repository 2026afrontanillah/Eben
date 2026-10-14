import type { Zona } from './zona';

export interface ConfiguracionZona {
  precioCentavos: number | null;
  habilitada: boolean;
}

export interface ZonasRepository {
  listarPorEvento(eventoId: string): Promise<Zona[]>;
  obtenerPorId(zonaId: string): Promise<Zona | null>;
  actualizarConfiguracion(zonaId: string, configuracion: ConfiguracionZona): Promise<void>;
}
