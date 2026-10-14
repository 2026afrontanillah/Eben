import { DomainError } from '@/shared/errors/domain-error';

export class EventoNoEncontradoError extends DomainError {
  constructor() {
    super('El evento no existe.');
  }
}

export class ZonaNoEncontradaError extends DomainError {
  constructor() {
    super('La zona no existe en este evento.');
  }
}
