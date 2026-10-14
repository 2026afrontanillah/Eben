import { AutoDesactivacionError, UsuarioNoEncontradoError } from '../domain/usuarios.errors';
import type { UsuariosRepository } from '../domain/usuarios.repository';

export interface CambioEstadoSolicitud {
  usuarioId: string;
  activo: boolean;
  solicitanteId: string;
}

export class CambiarEstadoUsuarioUseCase {
  constructor(private readonly usuarios: UsuariosRepository) {}

  async ejecutar(solicitud: CambioEstadoSolicitud): Promise<void> {
    if (!solicitud.activo && solicitud.usuarioId === solicitud.solicitanteId) {
      throw new AutoDesactivacionError();
    }

    const actualizado = await this.usuarios.cambiarEstado(solicitud.usuarioId, solicitud.activo);
    if (!actualizado) {
      throw new UsuarioNoEncontradoError();
    }
  }
}
