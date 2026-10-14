import { useId, type InputHTMLAttributes } from 'react';

import { cn } from './cn';
import { FieldMessage } from './FieldMessage';
import { FIELD_CONTROL_CLASS, FIELD_LABEL_CLASS } from './field-styles';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
}

export function TextField({ label, error, hint, id, className, ...inputProps }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-mensaje`;
  const hasMessage = Boolean(error ?? hint);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className={FIELD_LABEL_CLASS}>
        {label}
      </label>
      <input
        id={inputId}
        className={FIELD_CONTROL_CLASS}
        aria-invalid={error ? true : undefined}
        aria-describedby={hasMessage ? messageId : undefined}
        {...inputProps}
      />
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
}
