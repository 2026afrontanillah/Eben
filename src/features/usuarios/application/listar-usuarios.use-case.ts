import type { UsuarioListado } from '../domain/usuario';
import type { UsuariosRepository } from '../domain/usuarios.repository';

export class ListarUsuariosUseCase {
  constructor(private readonly usuarios: UsuariosRepository) {}

  ejecutar(): Promise<UsuarioListado[]> {
    return this.usuarios.listar();
  }
}
