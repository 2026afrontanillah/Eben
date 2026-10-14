import { useId, type TextareaHTMLAttributes } from 'react';

import { cn } from './cn';
import { FieldMessage } from './FieldMessage';
import { FIELD_LABEL_CLASS } from './field-styles';

interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
}

export function TextAreaField({ label, error, hint, id, className, ...textAreaProps }: TextAreaFieldProps) {
  const generatedId = useId();
  const textAreaId = id ?? generatedId;
  const messageId = `${textAreaId}-mensaje`;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={textAreaId} className={FIELD_LABEL_CLASS}>
        {label}
      </label>
      <textarea
        id={textAreaId}
        className="min-h-24 w-full rounded-xl border border-line bg-surface-raised p-3.5 text-base text-ink focus:border-transparent focus:outline-2 focus:outline-focus aria-invalid:border-danger"
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        {...textAreaProps}
      />
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
}
