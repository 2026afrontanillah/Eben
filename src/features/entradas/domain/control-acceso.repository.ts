import type { EntradaControl } from './control-acceso';

export interface ControlAccesoRepository {
  buscarPorId(entradaId: string): Promise<EntradaControl | null>;
  buscarPorCodigo(codigo: string): Promise<EntradaControl | null>;
  /** Devuelve `false` si la entrada dejó de estar válida entre la lectura y el registro. */
  registrarIngreso(entradaId: string, validadorId: string, fecha: Date): Promise<boolean>;
}
