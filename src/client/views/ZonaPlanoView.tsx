import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useRouter } from '../router';
import { useAuth } from '../AuthContext';
import { MesasPlano } from '@/features/asientos/presentation/components/MesasPlano';
import { MesaSvg } from '@/features/asientos/presentation/components/MesaSvg';
import { AsientosLeyenda } from '@/features/asientos/presentation/components/AsientosLeyenda';
import { TotalVenta } from '@/features/ventas/presentation/components/TotalVenta';
import type { MesaEstado } from '@/features/asientos/domain/mesa';
import { formatearBolivianos } from '@/shared/format/moneda';
import { PageHeader } from '@/shared/ui/PageHeader';
import { TextField } from '@/shared/ui/TextField';
import { SelectField } from '@/shared/ui/SelectField';
import { Button } from '@/shared/ui/Button';
import { Alert } from '@/shared/ui/Alert';

interface ZonaPlanoViewProps {
  zonaId: string;
}

export function ZonaPlanoView({ zonaId }: ZonaPlanoViewProps) {
  const { navigate } = useRouter();
  const [zona, setZona] = useState<any>(null);
  const [mesas, setMesas] = useState<readonly MesaEstado[]>([]);
  const [mesasPorFila, setMesasPorFila] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mesa seleccionada para abrir el diálogo de compra
  const [mesaSeleccionada, setMesaSeleccionada] = useState<MesaEstado | null>(null);

  const cargarDatos = async () => {
    try {
      const [datosZona, datosAsientos] = await Promise.all([
        api.getZona(zonaId),
        api.getZonaAsientos(zonaId),
      ]);
      setZona(datosZona);
      const mesasNormalizadas = (datosAsientos.mesas || []).map((m: any) => ({
        ...m,
        sillas: (m.sillas || []).map((s: any) => ({
          ...s,
          vendida: Boolean(s.vendida || s.estado === 'VENDIDO'),
        })),
      }));
      setMesas(mesasNormalizadas);
      setMesasPorFila(datosAsientos.mesasPorFila || 10);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el plano');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 10000);
    return () => clearInterval(interval);
  }, [zonaId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!zona) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 text-center">
        <h2 className="text-xl font-bold text-ink">Zona no encontrada</h2>
        <Button className="mt-4" onClick={() => navigate('/')}>
          Volver al mapa
        </Button>
      </div>
    );
  }

  const handleSeleccionarMesa = (numeroMesa: number) => {
    const encontrada = mesas.find((m) => m.numero === numeroMesa);
    if (encontrada) {
      setMesaSeleccionada(encontrada);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={zona.nombre}
        eyebrow="SELECCIÓN DE SILLAS"
        description={`${zona.disponibles} de ${zona.capacidad} sillas disponibles · ${
          zona.precioCentavos != null ? formatearBolivianos(zona.precioCentavos) : 'Sin precio'
        } por silla`}
        backHref="/"
        backLabel="Volver al mapa"
      />

      {error && <Alert tone="error">{error}</Alert>}

      {/* PLANO SVG INTERACTIVO */}
      <MesasPlano
        zonaNombre={zona.nombre}
        mesasPorFila={mesasPorFila}
        mesas={mesas}
        onSeleccionarMesa={handleSeleccionarMesa}
      />

      {/* MODAL DE COMPRA POR SILLA */}
      {mesaSeleccionada && (
        <VentaAsientosModal
          eventoId={zona.eventoId}
          zonaId={zona.id}
          zonaNombre={zona.nombre}
          precioUnitarioCentavos={zona.precioCentavos || 0}
          mesa={mesaSeleccionada}
          onClose={() => setMesaSeleccionada(null)}
          onSuccess={(ventaId) => {
            setMesaSeleccionada(null);
            navigate(`/ventas/${ventaId}`);
          }}
        />
      )}
    </div>
  );
}

interface VentaAsientosModalProps {
  eventoId: string;
  zonaId: string;
  zonaNombre: string;
  precioUnitarioCentavos: number;
  mesa: MesaEstado;
  onClose: () => void;
  onSuccess: (ventaId: string) => void;
}

function VentaAsientosModal({
  eventoId,
  zonaId,
  zonaNombre,
  precioUnitarioCentavos,
  mesa,
  onClose,
  onSuccess,
}: VentaAsientosModalProps) {
  const { user } = useAuth();
  const [sillasElegidas, setSillasElegidas] = useState<number[]>([]);
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

  const toggleSilla = (numero: number) => {
    const silla = mesa.sillas.find((s) => s.numero === numero);
    if (!silla || silla.vendida || (silla as any).estado === 'VENDIDO') return;

    setSillasElegidas((prev) =>
      prev.includes(numero) ? prev.filter((s) => s !== numero) : [...prev, numero].sort((a, b) => a - b)
    );
  };

  const totalCentavos = precioUnitarioCentavos * sillasElegidas.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sillasElegidas.length === 0) {
      setError('Debes seleccionar al menos una silla');
      return;
    }
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
      const res = await api.venderAsientos({
        eventoId,
        zonaId,
        mesa: mesa.numero,
        sillas: sillasElegidas,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
      <div className="my-auto max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <span className="text-xs font-bold tracking-wider text-brand uppercase">
              {zonaNombre}
            </span>
            <h2 className="text-2xl font-black text-ink">Mesa {mesa.numero}</h2>
            <p className="text-xs text-ink-muted">
              {formatearBolivianos(precioUnitarioCentavos)} por silla
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
          {/* ILUSTRACIÓN VISUAL DE LA MESA Y SILLAS */}
          <div className="flex flex-col items-center rounded-2xl border border-line bg-surface-raised/40 p-4">
            <p className="mb-2 text-xs font-semibold text-ink-muted">
              Haz clic sobre cada silla para seleccionarla:
            </p>

            <MesaSvg
              mesa={mesa}
              seleccionadas={new Set(sillasElegidas)}
              onAlternarSilla={toggleSilla}
              className="mx-auto block h-56 max-w-full drop-shadow-md select-none sm:h-64"
            />

            <div className="mt-3 w-full">
              <AsientosLeyenda />
            </div>

            {sillasElegidas.length > 0 && (
              <div className="mt-3 flex w-full items-center justify-between rounded-xl border border-line bg-surface px-3.5 py-2 text-xs">
                <span className="font-semibold text-ink">
                  {sillasElegidas.length} {sillasElegidas.length === 1 ? 'silla elegida' : 'sillas elegidas'}:{' '}
                  <span className="font-bold text-brand">
                    {sillasElegidas.map((s) => `#${s}`).join(', ')}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setSillasElegidas([])}
                  className="font-bold text-ink-muted hover:text-danger hover:underline"
                >
                  Limpiar
                </button>
              </div>
            )}
          </div>

          {/* TOTAL DINÁMICO */}
          <TotalVenta
            cantidad={sillasElegidas.length}
            precioUnitarioCentavos={precioUnitarioCentavos}
          />

          {/* DATOS DEL CLIENTE */}
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

          {/* MÉTODO DE PAGO */}
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
            <Button type="submit" disabled={sillasElegidas.length === 0} loading={submitting}>
              Confirmar compra ({formatearBolivianos(totalCentavos)})
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
