import { DomainError } from '@/shared/errors/domain-error';

export class EmailEnUsoError extends DomainError {
  constructor() {
    super('Ya existe un usuario con ese email.');
  }
}

export class UsuarioNoEncontradoError extends DomainError {
  constructor() {
    super('El usuario no existe.');
  }
}

export class AutoDesactivacionError extends DomainError {
  constructor() {
    super('No puedes desactivar tu propia cuenta.');
  }
}
