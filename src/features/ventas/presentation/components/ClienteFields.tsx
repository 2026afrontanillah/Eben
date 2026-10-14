import { getFieldError, type ActionResult } from '@/shared/actions/action-result';
import { TextField } from '@/shared/ui/TextField';

interface ClienteFieldsProps {
  state: ActionResult<unknown> | null;
}

export function ClienteFields({ state }: ClienteFieldsProps) {
  return (
    <fieldset className="grid gap-4">
      <legend className="mb-1 text-base font-extrabold text-ink">Datos del cliente</legend>
      <TextField
        label="Nombre del cliente"
        name="clienteNombre"
        autoComplete="off"
        maxLength={100}
        placeholder="Nombre y apellido"
        required
        error={getFieldError(state, 'clienteNombre')}
      />
      <TextField
        label="Celular"
        name="clienteCelular"
        type="tel"
        inputMode="tel"
        autoComplete="off"
        maxLength={30}
        placeholder="Ej. 70000000"
        required
        error={getFieldError(state, 'clienteCelular')}
      />
      <TextField
        label="Email (opcional)"
        name="clienteEmail"
        type="email"
        inputMode="email"
        autoComplete="off"
        maxLength={150}
        placeholder="cliente@email.com"
        error={getFieldError(state, 'clienteEmail')}
      />
    </fieldset>
  );
}
