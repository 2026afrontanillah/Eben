'use client';

import { startTransition, useActionState, useCallback, useRef, type FormEvent } from 'react';

import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { FIELD_CONTROL_CLASS, FIELD_LABEL_CLASS } from '@/shared/ui/field-styles';

import { validarEntradaAction } from '../actions/validar-entrada.action';
import { CamaraScanner } from './CamaraScanner';
import { ResultadoValidacionCard } from './ResultadoValidacionCard';

export function ControlAccesoPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, dispatch, pending] = useActionState(validarEntradaAction, null);

  const validar = useCallback(
    (lectura: string) => {
      const formData = new FormData();
      formData.set('lectura', lectura);
      startTransition(() => dispatch(formData));
    },
    [dispatch],
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = inputRef.current;
    if (!input) {
      return;
    }
    validar(input.value);
    input.value = '';
    input.focus();
  };

  return (
    <div className="grid gap-5">
      <Card>
        <form onSubmit={onSubmit} className="grid gap-3">
          <label htmlFor="lectura-entrada" className={FIELD_LABEL_CLASS}>
            Código o QR de la entrada
          </label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              id="lectura-entrada"
              name="lectura"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="Escanea o escribe el código"
              className={FIELD_CONTROL_CLASS}
              // El lector QR USB/Bluetooth escribe como teclado: el campo debe estar listo al abrir la página.
              autoFocus
            />
            <Button type="submit" loading={pending}>
              Validar
            </Button>
          </div>
        </form>
        <div className="mt-4">
          <CamaraScanner onDetect={validar} />
        </div>
      </Card>
      <ResultadoValidacionCard state={state} />
    </div>
  );
}
