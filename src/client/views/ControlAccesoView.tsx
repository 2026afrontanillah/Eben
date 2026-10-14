import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { Html5CameraScanner } from '../components/Html5CameraScanner';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Button } from '@/shared/ui/Button';
import { formatearFechaHora } from '@/shared/format/fecha';
import {
  initMobileAudio,
  playSuccessSound,
  playAlertSound,
  triggerVibrate,
} from '../utils/scannerSound';

interface ResultadoAcceso {
  tipo: 'ADMITIDA' | 'YA_USADA' | 'ANULADA' | 'QR_INVALIDO' | 'NO_ENCONTRADA' | 'ERROR';
  codigo?: string;
  mensaje?: string;
  entrada?: {
    id: string;
    codigo: string;
    zonaNombre: string;
    clienteNombre: string;
    ubicacion?: string | null;
    estado: string;
    usadaEn?: string | null;
    primerIngresoEn?: string | null;
    ultimoIntentoEn?: string | null;
    validadaPor?: string | null;
    totalIntentos?: number;
  };
}

interface ItemHistorial {
  id: string;
  codigo: string;
  resultado: string;
  mensaje?: string;
  clienteNombre?: string;
  zonaNombre?: string;
  ubicacion?: string;
  intentos?: number;
  validadaPor?: string;
  registradoEn: string;
}

export function ControlAccesoView() {
  const { user } = useAuth();
  const [codigoManual, setCodigoManual] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAcceso | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  // Estadísticas globales de acceso
  const [totalIngresados, setTotalIngresados] = useState(0);
  const [totalRechazados, setTotalRechazados] = useState(0);
  const [historial, setHistorial] = useState<ItemHistorial[]>([]);

  // Timer de auto-cierre para escaneo continuo manos libres
  const autoDismissTimerRef = useRef<number | null>(null);
  const isProcessingRef = useRef(false);

  // Cargar estadísticas e historial iniciales
  const cargarStats = async () => {
    try {
      const data = await api.getControlStats();
      if (data) {
        setTotalIngresados(data.totalIngresados || 0);
        setTotalRechazados(data.totalRechazados || 0);
        if (Array.isArray(data.ultimos)) {
          setHistorial(data.ultimos);
        }
      }
    } catch (err) {
      console.warn('Error al cargar estadísticas:', err);
    }
  };

  useEffect(() => {
    cargarStats();
    const interval = setInterval(cargarStats, 8000);
    return () => clearInterval(interval);
  }, []);

  // Desbloquear audio en el primer clic o toque
  useEffect(() => {
    const unlockHandler = () => {
      initMobileAudio();
    };
    window.addEventListener('click', unlockHandler, { once: true });
    window.addEventListener('touchstart', unlockHandler, { once: true });
    return () => {
      window.removeEventListener('click', unlockHandler);
      window.removeEventListener('touchstart', unlockHandler);
    };
  }, []);

  // Limpiar timer de auto-cierre
  const cerrarModalYContinuar = () => {
    if (autoDismissTimerRef.current) {
      window.clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }
    setModalAbierto(false);
    // Pausa breve para evitar re-lectura accidental del mismo cuadro de cámara
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 450);
  };

  // Validar código recibido
  const procesarValidacion = async (lectura: string) => {
    if (!lectura.trim() || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setLoading(true);

    try {
      const res: ResultadoAcceso = await api.validarEntrada(lectura.trim());
      setResultado(res);
      setModalAbierto(true);

      if (res.tipo === 'ADMITIDA') {
        // PRIMER INGRESO VÁLIDO: Sonido PIP y vibración corta
        playSuccessSound();

        // Actualizar contadores locales al instante
        setTotalIngresados((prev) => prev + 1);

        // Auto-cierre en 2.2 segundos para continuar con la fila
        if (autoDismissTimerRef.current) {
          window.clearTimeout(autoDismissTimerRef.current);
        }
        autoDismissTimerRef.current = window.setTimeout(() => {
          cerrarModalYContinuar();
        }, 2200);
      } else {
        // ENTRADA YA USADA (REPETIDA), ANULADA O INVÁLIDA: Alarma Beep-Beep y vibración fuerte
        playAlertSound();
        setTotalRechazados((prev) => prev + 1);
        // NO se auto-cierra para que el operador detenga a la persona y revise la pantalla
      }

      // Actualizar historial
      cargarStats();
      setCodigoManual('');
    } catch (err: any) {
      playAlertSound();
      setResultado({
        tipo: 'ERROR',
        mensaje: err.message || 'Error de conexión al validar código',
      });
      setModalAbierto(true);
    } finally {
      setLoading(false);
    }
  };

  // Envío manual de código
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigoManual.trim()) {
      procesarValidacion(codigoManual.trim());
    }
  };

  // Probar sonido con el botón
  const handleTestSound = () => {
    initMobileAudio();
    playSuccessSound();
  };

  // Reiniciar accesos (Solo Administradores)
  const handleReiniciarAccesos = async () => {
    if (
      !confirm(
        '¿Estás seguro de que deseas reiniciar todos los ingresos en puerta? Esto dejará todas las entradas en estado VÁLIDA para pruebas.'
      )
    ) {
      return;
    }
    try {
      await api.reiniciarAccesos();
      await cargarStats();
      alert('Accesos reiniciados con éxito');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const esExito = resultado?.tipo === 'ADMITIDA';
  const esDuplicada = resultado?.tipo === 'YA_USADA';

  return (
    <div className="flex flex-col gap-5">
      {/* Encabezado */}
      <PageHeader
        title="Control de Acceso en Puerta"
        eyebrow="PORTERÍA & VALIDACIÓN"
        description="Escanea el código QR de la entrada con la cámara del celular o un lector láser. Detecta entradas ya usadas en tiempo real."
      />

      {/* BARRA DE ESTADÍSTICAS EN VIVO (Inspirada en escaneo) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Adentro */}
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 shadow-lg">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/20 text-xl text-emerald-400">
            ✓
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              Adentro (Ingresaron)
            </span>
            <p className="text-2xl font-black text-ink">{totalIngresados}</p>
          </div>
        </div>

        {/* Rechazados / Duplicados */}
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 shadow-lg">
          <div className="flex size-10 items-center justify-center rounded-xl bg-rose-500/20 text-xl text-rose-400">
            ⚠️
          </div>
          <div>
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
              Rechazados / Repetidos
            </span>
            <p className="text-2xl font-black text-ink">{totalRechazados}</p>
          </div>
        </div>

        {/* Botón Probar Sonido */}
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-surface p-4 shadow-lg">
          <div>
            <span className="text-[11px] font-bold text-ink-muted uppercase">Audio de Piteo</span>
            <p className="text-xs text-ink-subtle">Parlante móvil</p>
          </div>
          <button
            type="button"
            onClick={handleTestSound}
            className="flex items-center gap-1.5 rounded-xl border border-line bg-surface-raised px-3 py-2 text-xs font-bold text-ink hover:border-brand hover:text-brand transition"
            title="Probar sonido ¡Pip! y desbloquear audio en móvil"
          >
            🔊 Probar Pip
          </button>
        </div>

        {/* Acciones de gestión */}
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-surface p-4 shadow-lg">
          <div>
            <span className="text-[11px] font-bold text-ink-muted uppercase">Asistencia</span>
            <p className="text-xs text-ink-subtle">Reporte puerta</p>
          </div>
          <div className="flex items-center gap-1.5">
            <a
              href="/api/control/exportar-asistencia"
              download
              className="flex items-center gap-1 rounded-xl border border-line bg-surface-raised px-2.5 py-2 text-xs font-bold text-ink hover:border-line-strong hover:text-white transition"
              title="Descargar lista completa en Excel / CSV"
            >
              📥 CSV
            </a>
            {user?.rol === 'ADMIN' && (
              <button
                type="button"
                onClick={handleReiniciarAccesos}
                className="flex items-center gap-1 rounded-xl border border-rose-500/40 bg-rose-500/10 px-2.5 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition"
                title="Reiniciar lista de accesos para pruebas"
              >
                🔄 Reset
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* COLUMNA PRINCIPAL: ESCÁNER CON CÁMARA */}
        <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-2xl lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
              Lector QR en Puerta
            </h2>
            <span className="text-xs text-ink-muted">Detección continua automática</span>
          </div>

          {/* Componente de escaneo por cámara Html5Qrcode */}
          <Html5CameraScanner
            onScan={(codigoDetectado) => procesarValidacion(codigoDetectado)}
            isPaused={modalAbierto}
          />

          {/* Separador */}
          <div className="flex items-center gap-3">
            <hr className="flex-1 border-line" />
            <span className="text-[11px] font-bold text-ink-subtle uppercase tracking-wider">
              O Digitación Manual
            </span>
            <hr className="flex-1 border-line" />
          </div>

          {/* Formulario manual de validación */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Código de ticket (ej: VIP-M1-S5-XYZ o número)"
                value={codigoManual}
                onChange={(e) => setCodigoManual(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface-raised px-4 py-2.5 text-sm font-mono text-ink uppercase placeholder:text-ink-subtle focus:border-brand focus:outline-none"
              />
            </div>
            <Button type="submit" loading={loading}>
              Validar
            </Button>
          </form>
        </div>

        {/* COLUMNA LATERAL: FEED EN VIVO DE ÚLTIMOS INGRESOS */}
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-2xl lg:col-span-5">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="text-sm font-bold text-ink">Historial Reciente en Puerta</h3>
            <button
              type="button"
              onClick={cargarStats}
              className="text-xs text-ink-muted hover:text-ink transition"
            >
              🔄 Refrescar
            </button>
          </div>

          {historial.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center text-center text-ink-muted p-4">
              <span className="text-3xl mb-2">🎟️</span>
              <p className="text-xs">Aún no se han registrado lecturas en esta puerta.</p>
              <span className="text-[11px] text-ink-subtle mt-1">
                Los escaneos aparecerán aquí en vivo.
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[380px] pr-1">
              {historial.map((item) => {
                const esAdmitido = item.resultado === 'ADMITIDA';
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between rounded-xl border p-3 transition ${
                      esAdmitido
                        ? 'border-emerald-500/20 bg-emerald-950/10'
                        : 'border-rose-500/20 bg-rose-950/15'
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-ink">
                          #{item.codigo}
                        </span>
                        {item.ubicacion && (
                          <span className="text-[11px] text-ink-muted">· {item.ubicacion}</span>
                        )}
                      </div>
                      <span className="text-[11px] text-ink-subtle">
                        {formatearFechaHora(item.registradoEn)}
                        {item.clienteNombre && ` · ${item.clienteNombre}`}
                      </span>
                    </div>

                    <span
                      className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        esAdmitido
                          ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                          : 'border border-rose-500/40 bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {esAdmitido ? 'INGRESÓ' : `REPETIDO (${item.intentos || 2})`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE RESULTADO EN PANTALLA COMPLETA (Estilo !eben Producciones + Lógica de escaneo) */}
      {modalAbierto && resultado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className={`relative flex w-full max-w-md flex-col overflow-hidden rounded-3xl border p-6 shadow-2xl transition-all sm:p-7 ${
              esExito
                ? 'border-emerald-500/60 bg-gradient-to-b from-surface-raised via-surface to-emerald-950/30'
                : esDuplicada
                ? 'border-rose-500/60 bg-gradient-to-b from-surface-raised via-surface to-rose-950/40'
                : 'border-amber-500/60 bg-gradient-to-b from-surface-raised via-surface to-amber-950/30'
            }`}
          >
            {/* Barra animada de auto-cierre (solo cuando es válido) */}
            {esExito && (
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-line">
                <div className="animate-countdown h-full bg-emerald-400" />
              </div>
            )}

            {/* Icono y Estado Principal */}
            <div className="flex flex-col items-center text-center gap-3">
              <div
                className={`flex size-20 items-center justify-center rounded-3xl text-4xl shadow-xl ${
                  esExito
                    ? 'border-2 border-emerald-400 bg-emerald-500/20 text-emerald-400 shadow-emerald-500/30'
                    : esDuplicada
                    ? 'border-2 border-rose-500 bg-rose-500/20 text-rose-400 shadow-rose-500/30 animate-pulse'
                    : 'border-2 border-amber-500 bg-amber-500/20 text-amber-400 shadow-amber-500/30'
                }`}
              >
                {esExito ? '✓' : esDuplicada ? '⚠️' : '✕'}
              </div>

              <div>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest ${
                    esExito
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : esDuplicada
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {esExito && 'PRIMER INGRESO VÁLIDO'}
                  {esDuplicada && `ENTRADA YA UTILIZADA (INTENTO #${resultado.entrada?.totalIntentos || 2})`}
                  {resultado.tipo === 'ANULADA' && 'VENTA ANULADA'}
                  {resultado.tipo === 'QR_INVALIDO' && 'QR INVÁLIDO O FALSIFICADO'}
                  {resultado.tipo === 'NO_ENCONTRADA' && 'ENTRADA NO ENCONTRADA'}
                  {resultado.tipo === 'ERROR' && 'ERROR'}
                </span>

                <h3
                  className={`mt-2 text-2xl font-black tracking-tight sm:text-3xl ${
                    esExito ? 'text-emerald-400' : esDuplicada ? 'text-rose-400' : 'text-amber-400'
                  }`}
                >
                  {esExito && '¡ACCESO PERMITIDO!'}
                  {esDuplicada && '¡ENTRADA YA UTILIZADA!'}
                  {resultado.tipo === 'ANULADA' && 'ACCESO DENEGADO'}
                  {resultado.tipo === 'QR_INVALIDO' && 'QR NO AUTORIZADO'}
                  {resultado.tipo === 'NO_ENCONTRADA' && 'TICKET INEXISTENTE'}
                  {resultado.tipo === 'ERROR' && 'ERROR DE SISTEMA'}
                </h3>

                <p className="mt-1 text-xs text-ink-muted">
                  {resultado.mensaje || (esExito ? 'Entrada verificada con éxito' : 'Revisar boleto')}
                </p>
              </div>
            </div>

            {/* Tarjeta de detalles del ticket */}
            {resultado.entrada && (
              <div className="mt-5 rounded-2xl border border-line bg-black/60 p-4 text-ink flex flex-col gap-2.5">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <span className="text-xs text-ink-muted">Código de entrada</span>
                  <span className="font-mono text-sm font-black text-brand">
                    #{resultado.entrada.codigo}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-ink-subtle">Cliente</span>
                    <p className="font-bold text-ink">{resultado.entrada.clienteNombre}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-ink-subtle">Sector</span>
                    <p className="font-bold text-ink">{resultado.entrada.zonaNombre}</p>
                  </div>
                  {resultado.entrada.ubicacion && (
                    <div className="col-span-2">
                      <span className="text-[11px] text-ink-subtle">Asiento asignado</span>
                      <p className="text-sm font-black text-amber-300">
                        🪑 {resultado.entrada.ubicacion}
                      </p>
                    </div>
                  )}
                </div>

                {/* Información de auditoría en caso de duplicado */}
                {esDuplicada && resultado.entrada.primerIngresoEn && (
                  <div className="mt-2 rounded-xl border border-rose-500/30 bg-rose-950/30 p-2.5 text-xs text-rose-300 flex flex-col gap-1">
                    <span className="font-bold flex items-center gap-1">
                      ⏰ Primer ingreso registrado a las:
                    </span>
                    <p className="font-mono text-ink">
                      {formatearFechaHora(resultado.entrada.primerIngresoEn)}
                    </p>
                    {resultado.entrada.validadaPor && (
                      <span className="text-[11px] text-ink-muted">
                        Operador: {resultado.entrada.validadaPor}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Botones de acción */}
            <div className="mt-6 flex flex-col gap-2">
              <Button
                type="button"
                variant={esExito ? 'primary' : 'danger'}
                onClick={cerrarModalYContinuar}
                className="w-full py-3 text-sm font-bold shadow-xl"
              >
                {esExito ? 'Siguiente Entrada (Auto 2s)' : 'Entendido / Continuar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
