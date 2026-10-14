import { useId, type SelectHTMLAttributes } from 'react';

import { cn } from './cn';
import { FieldMessage } from './FieldMessage';
import { FIELD_CONTROL_CLASS, FIELD_LABEL_CLASS } from './field-styles';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  label: string;
  options?: readonly SelectOption[];
  error?: string;
  className?: string;
  children?: React.ReactNode;
}

export function SelectField({
  label,
  options,
  children,
  error,
  id,
  className,
  ...selectProps
}: SelectFieldProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const messageId = `${selectId}-mensaje`;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={selectId} className={FIELD_LABEL_CLASS}>
        {label}
      </label>
      <select
        id={selectId}
        className={FIELD_CONTROL_CLASS}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? messageId : undefined}
        {...selectProps}
      >
        {options
          ? options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          : children}
      </select>
      <FieldMessage id={messageId} error={error} />
    </div>
  );
}
