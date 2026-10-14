import { buttonClassName } from '@/shared/ui/button-styles';
import { FIELD_CONTROL_CLASS } from '@/shared/ui/field-styles';

interface VentasSearchFormProps {
  busqueda: string;
}

export function VentasSearchForm({ busqueda }: VentasSearchFormProps) {
  return (
    <form role="search" action="/ventas" method="get" className="flex gap-2">
      <label htmlFor="buscar-ventas" className="sr-only">
        Buscar ventas
      </label>
      <input
        id="buscar-ventas"
        name="q"
        type="search"
        defaultValue={busqueda}
        placeholder="Cliente, celular o código"
        className={FIELD_CONTROL_CLASS}
      />
      <button type="submit" className={buttonClassName({ variant: 'secondary' })}>
        Buscar
      </button>
    </form>
  );
}
