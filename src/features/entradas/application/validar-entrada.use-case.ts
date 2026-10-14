import type { EntradaControl, ResultadoValidacion } from '../domain/control-acceso';
import type { ControlAccesoRepository } from '../domain/control-acceso.repository';
import { LecturaVaciaError } from '../domain/entradas.errors';
import type { EntradaQrSigner } from './entrada-qr-signer';

export interface ValidacionSolicitud {
  lectura: string;
  validadorId: string;
}

type BusquedaEntrada = { tipo: 'QR_INVALIDO' } | { tipo: 'ENCONTRADA'; entrada: EntradaControl | null };

export class ValidarEntradaUseCase {
  constructor(
    private readonly controlAcceso: ControlAccesoRepository,
    private readonly qrSigner: EntradaQrSigner,
    private readonly ahora: () => Date = () => new Date(),
  ) {}

  async ejecutar({ lectura, validadorId }: ValidacionSolicitud): Promise<ResultadoValidacion> {
    const busqueda = await this.buscar(lectura.trim());
    if (busqueda.tipo === 'QR_INVALIDO') {
      return busqueda;
    }

    const { entrada } = busqueda;
    if (!entrada) {
      return { tipo: 'NO_ENCONTRADA' };
    }

    const resultadoPrevio = this.resultadoSegunEstado(entrada);
    if (resultadoPrevio) {
      return resultadoPrevio;
    }

    const fecha = this.ahora();
    const registrada = await this.controlAcceso.registrarIngreso(entrada.id, validadorId, fecha);
    if (registrada) {
      return { tipo: 'ADMITIDA', entrada: { ...entrada, estado: 'USADA', usadaEn: fecha } };
    }

    const actualizada = await this.controlAcceso.buscarPorId(entrada.id);
    return this.resultadoSegunEstado(actualizada ?? entrada) ?? { tipo: 'YA_USADA', entrada };
  }

  private async buscar(lectura: string): Promise<BusquedaEntrada> {
    if (lectura === '') {
      throw new LecturaVaciaError();
    }

    if (this.qrSigner.looksLikeToken(lectura)) {
      const entradaId = this.qrSigner.verify(lectura);
      if (!entradaId) {
        return { tipo: 'QR_INVALIDO' };
      }
      return { tipo: 'ENCONTRADA', entrada: await this.controlAcceso.buscarPorId(entradaId) };
    }

    return { tipo: 'ENCONTRADA', entrada: await this.controlAcceso.buscarPorCodigo(lectura.toUpperCase()) };
  }

  private resultadoSegunEstado(entrada: EntradaControl): ResultadoValidacion | null {
    if (entrada.estado === 'ANULADA') {
      return { tipo: 'ANULADA', entrada };
    }
    if (entrada.estado === 'USADA') {
      return { tipo: 'YA_USADA', entrada };
    }
    return null;
  }
}
