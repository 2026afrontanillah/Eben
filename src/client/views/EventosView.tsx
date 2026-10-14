import React, { useEffect, useState, type CSSProperties } from 'react';
import { api } from '../api';
import { useRouter } from '../router';
import { useAuth } from '../AuthContext';
import { formatearBolivianos } from '@/shared/format/moneda';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { TextField } from '@/shared/ui/TextField';
import { SelectField } from '@/shared/ui/SelectField';
import { Alert } from '@/shared/ui/Alert';

interface Zona {
  id: string;
  codigo: string;
  nombre: string;
  tipo: 'GENERAL' | 'NUMERADA';
  precioCentavos: number | null;
  capacidad: number;
  disponibles: number;
  habilitada: boolean;
  areaPlano: string;
  color: string;
  orden: number;
  mesas?: number;
  sillasPorMesa?: number;
  mesasPorFila?: number;
}

interface Evento {
  id: string;
  slug: string;
  nombre: string;
  lugar?: string;
  fecha?: string;
  planoColumnas: string;
  planoFilas: string;
  zonas: Zona[];
}

export function EventosView() {
  const { navigate } = useRouter();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal para venta general
  const [zonaGeneralSeleccionada, setZonaGeneralSeleccionada] = useState<Zona | null>(null);

  const cargarEvento = async () => {
    try {
      const data = await api.getEventoActivo();
      setEvento(data.evento);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el evento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEvento();
    const interval = setInterval(cargarEvento, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 text-center">
        <h2 className="text-xl font-bold text-ink">No hay eventos activos</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Cuando un administrador active un evento, aparecerá aquí el mapa de sectores.
        </p>
      </div>
    );
  }

  const handleZonaClick = (zona: Zona) => {
    if (!zona.habilitada || zona.precioCentavos == null || zona.disponibles === 0) {
      return;
    }

    if (zona.tipo === 'NUMERADA') {
      navigate(`/eventos/${evento.id}/zonas/${zona.id}`);
    } else {
      setZonaGeneralSeleccionada(zona);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Event Header */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <span className="text-xs font-black tracking-widest text-brand uppercase">
            EVENTO ACTIVO
          </span>
          <h1 className="mt-0.5 text-2xl font-black tracking-tight text-ink sm:text-3xl">
            {evento.nombre}
          </h1>
          {evento.lugar && <p className="text-xs text-ink-muted">{evento.lugar}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block size-2 animate-pulse rounded-full bg-success" />
          <span className="text-xs text-ink-subtle">Actualización en vivo</span>
        </div>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {/* DISPOSICIÓN PRINCIPAL EN 2 COLUMNAS (MAPA Y LISTA DE SECTORES) SIN SCROLL */}
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr] lg:items-start">
        {/* MAPA DE SECTORES (SIN SCROLL) */}
        <section
          aria-label="Mapa de sectores"
          className="overflow-hidden rounded-2xl border border-line bg-surface/85 p-3 shadow-xl backdrop-blur-md sm:p-4"
        >
          <div className="mb-2.5 rounded-lg bg-brand py-2 text-center text-xs font-black tracking-[0.35em] text-brand-ink">
            ESCENARIO
          </div>

          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: evento.planoColumnas || '1fr 2.4fr 1fr',
              gridTemplateRows: 'clamp(70px, 9vw, 90px) clamp(95px, 13vw, 125px) 55px',
            }}
          >
            {evento.zonas.map((zona) => {
              const porcentaje =
                zona.capacidad > 0
                  ? Math.round((zona.disponibles / zona.capacidad) * 100)
                  : 0;

              const colorVendido = `color-mix(in oklab, ${zona.color} 22%, #050506)`;
              const background =
                zona.capacidad === 0
                  ? zona.color
                  : `linear-gradient(to top, ${zona.color} 0%, ${zona.color} ${porcentaje}%, ${colorVendido} ${porcentaje}%, ${colorVendido} 100%)`;

              const habilitadaParaVenta =
                zona.habilitada && zona.precioCentavos != null && zona.disponibles > 0;

              let estadoTexto = `${zona.disponibles} / ${zona.capacidad}`;
              if (!zona.habilitada) estadoTexto = 'No disponible';
              else if (zona.precioCentavos == null) estadoTexto = 'Sin precio';
              else if (zona.disponibles === 0) estadoTexto = 'Agotado';

              return (
                <button
                  key={zona.id}
                  type="button"
                  disabled={!habilitadaParaVenta}
                  onClick={() => handleZonaClick(zona)}
                  style={
                    {
                      gridArea: zona.areaPlano,
                      background,
                      '--zona-color': zona.color,
                    } as CSSProperties
                  }
                  className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl p-2 text-center text-white ring-1 ring-white/10 ring-inset transition [text-shadow:0_1px_3px_rgb(0_0_0/0.55)] ${
                    habilitadaParaVenta
                      ? 'cursor-pointer hover:brightness-110 hover:shadow-[0_0_24px_-4px_var(--zona-color)]'
                      : 'cursor-not-allowed opacity-60 saturate-50'
                  }`}
                >
                  <span className="text-xs font-black tracking-wide break-words uppercase sm:text-sm">
                    {zona.nombre}
                  </span>
                  <span className="max-w-full rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold">
                    {estadoTexto}
                  </span>
                  {zona.precioCentavos != null && (
                    <span className="text-[10px] font-bold text-ink-muted">
                      {formatearBolivianos(zona.precioCentavos)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* LISTA COMPACTA DE SECTORES */}
        <section className="flex flex-col gap-2.5">
          <h2 className="text-sm font-extrabold tracking-wider text-ink uppercase">
            Sectores y precios
          </h2>

          <div className="flex flex-col gap-2">
            {evento.zonas.map((zona) => (
              <div
                key={zona.id}
                className="flex items-center justify-between rounded-xl border border-line bg-surface p-3 transition hover:border-line-strong"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: zona.color }}
                  />
                  <div>
                    <h3 className="text-sm font-bold text-ink">{zona.nombre}</h3>
                    <p className="text-xs text-ink-muted">
                      {zona.tipo === 'NUMERADA' ? 'Mesas numeradas' : 'Entrada general'} ·{' '}
                      {zona.precioCentavos != null ? (
                        <span className="font-semibold text-ink">
                          {formatearBolivianos(zona.precioCentavos)}
                        </span>
                      ) : (
                        <span className="text-warning">Sin precio</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-subtle">
                    {zona.disponibles} libres
                  </span>
                  <Button
                    size="sm"
                    variant={zona.tipo === 'NUMERADA' ? 'primary' : 'secondary'}
                    disabled={!zona.habilitada || zona.precioCentavos == null || zona.disponibles === 0}
                    onClick={() => handleZonaClick(zona)}
                  >
                    {zona.tipo === 'NUMERADA' ? 'Mesas' : 'Vender'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* MODAL DE VENTA GENERAL */}
      {zonaGeneralSeleccionada && (
        <VentaGeneralModal
          eventoId={evento.id}
          zona={zonaGeneralSeleccionada}
          onClose={() => setZonaGeneralSeleccionada(null)}
          onSuccess={(ventaId) => {
            setZonaGeneralSeleccionada(null);
            navigate(`/ventas/${ventaId}`);
          }}
        />
      )}
    </div>
  );
}

interface VentaGeneralModalProps {
  eventoId: string;
  zona: Zona;
  onClose: () => void;
  onSuccess: (ventaId: string) => void;
}

function VentaGeneralModal({ eventoId, zona, onClose, onSuccess }: VentaGeneralModalProps) {
  const { user } = useAuth();
  const [cantidad, setCantidad] = useState(1);
  const [nombre, setNombre] = useState(() => user?.nombre || '');
  const [celular, setCelular] = useState(() => user?.celular || localStorage.getItem('eben_user_celular') || '');
  const [email, setEmail] = useState(() => user?.email || '');
  const [metodo, setMetodo] = useState('EFECTIVO');
  const [referencia, setReferencia] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setNombre((prev) => prev || user.nombre || '');
      setEmail((prev) => prev || user.email || '');
      const savedCel = user.celular || localStorage.getItem('eben_user_celular') || '';
      setCelular((prev) => prev || savedCel);
    }
  }, [user]);

  const precioUnitario = zona.precioCentavos || 0;
  const maximo = Math.min(10, zona.disponibles);
  const totalCentavos = precioUnitario * cantidad;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !celular.trim()) {
      setError('Nombre y celular del cliente son requeridos');
      return;
    }
    if (['QR', 'TRANSFERENCIA'].includes(metodo) && !referencia.trim()) {
      setError('El comprobante o referencia es obligatorio para pagos por QR o Transferencia');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.venderGeneral({
        eventoId,
        zonaId: zona.id,
        cantidad,
        cliente: {
          nombre: nombre.trim(),
          celular: celular.trim(),
          email: email.trim() || undefined,
        },
        pago: {
          metodo,
          referencia: referencia.trim() || undefined,
        },
      });
      if (celular.trim()) {
        localStorage.setItem('eben_user_celular', celular.trim());
      }
      onSuccess(res.ventaId);
    } catch (err: any) {
      setError(err.message || 'Error al procesar la venta');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <span className="text-xs font-bold tracking-wider text-brand uppercase">
              VENTA GENERAL
            </span>
            <h2 className="text-xl font-black text-ink">{zona.nombre}</h2>
            <p className="text-xs text-ink-muted">
              {formatearBolivianos(precioUnitario)} c/u · {zona.disponibles} disponibles
            </p>
            {user && (
              <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-brand/15 px-2 py-0.5 text-[11px] font-semibold text-brand">
                ✓ Autocompletado con tu cuenta ({user.nombre})
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full bg-surface-strong text-xl text-ink hover:bg-line"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          {/* Selector de cantidad */}
          <div>
            <label className="text-xs font-semibold text-ink-muted">Cantidad de entradas</label>
            <div className="mt-1 flex items-center gap-3">
              <button
                type="button"
                disabled={cantidad <= 1}
                onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                className="grid size-10 place-items-center rounded-lg border border-line bg-surface-raised text-lg font-bold text-ink disabled:opacity-40"
              >
                -
              </button>
              <span className="text-lg font-extrabold text-ink">{cantidad}</span>
              <button
                type="button"
                disabled={cantidad >= maximo}
                onClick={() => setCantidad((c) => Math.min(maximo, c + 1))}
                className="grid size-10 place-items-center rounded-lg border border-line bg-surface-raised text-lg font-bold text-ink disabled:opacity-40"
              >
                +
              </button>
              <span className="text-sm font-semibold text-ink-muted">
                Total: <span className="font-bold text-ink">{formatearBolivianos(totalCentavos)}</span>
              </span>
            </div>
          </div>

          {/* Datos cliente */}
          <TextField
            label="Nombre completo del cliente"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Celular"
              type="tel"
              required
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
            />
            <TextField
              label="Email (opcional)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Método de pago */}
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label="Método de pago"
              required
              value={metodo}
              onChange={(e) => setMetodo(e.target.value)}
            >
              <option value="EFECTIVO">Efectivo</option>
              <option value="QR">QR</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="TARJETA">Tarjeta</option>
            </SelectField>

            <TextField
              label={
                ['QR', 'TRANSFERENCIA'].includes(metodo)
                  ? 'N.º de comprobante (obligatorio)'
                  : 'Referencia (opcional)'
              }
              required={['QR', 'TRANSFERENCIA'].includes(metodo)}
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
            />
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          <div className="mt-2 flex items-center justify-end gap-3 border-t border-line pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              Confirmar venta ({formatearBolivianos(totalCentavos)})
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
