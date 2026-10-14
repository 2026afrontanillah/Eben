import { DomainError } from '@/shared/errors/domain-error';

export class LecturaVaciaError extends DomainError {
  constructor() {
    super('Escanea el QR o escribe el código de la entrada.');
  }
}
