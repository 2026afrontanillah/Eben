import { normalizarEmail } from '@/features/auth/domain/email';
import type { PasswordHasher } from '@/features/auth/domain/password-hasher';

import { EmailEnUsoError } from '../domain/usuarios.errors';
import type { UsuariosRepository } from '../domain/usuarios.repository';
import type { CrearUsuarioInput } from './usuario.schemas';

export class CrearUsuarioUseCase {
  constructor(
    private readonly usuarios: UsuariosRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async ejecutar(datos: CrearUsuarioInput): Promise<void> {
    const email = normalizarEmail(datos.email);
    if (await this.usuarios.existeEmail(email)) {
      throw new EmailEnUsoError();
    }

    await this.usuarios.crear({
      nombre: datos.nombre.trim(),
      email,
      rol: datos.rol,
      passwordHash: await this.passwordHasher.hash(datos.password),
    });
  }
}
