import { DomainError } from '@/shared/errors/domain-error';

export class CredencialesInvalidasError extends DomainError {
  constructor() {
    super('Email o contraseña incorrectos.');
  }
}

export class SesionRequeridaError extends DomainError {
  constructor() {
    super('Tu sesión expiró. Vuelve a iniciar sesión.');
  }
}

export class PermisoDenegadoError extends DomainError {
  constructor() {
    super('No tienes permiso para realizar esta acción.');
  }
}
