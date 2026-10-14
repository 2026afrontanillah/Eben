interface FieldMessageProps {
  id: string;
  error?: string;
  hint?: string;
}

export function FieldMessage({ id, error, hint }: FieldMessageProps) {
  if (error) {
    return (
      <p id={id} className="text-sm text-danger">
        {error}
      </p>
    );
  }

  if (hint) {
    return (
      <p id={id} className="text-xs text-ink-subtle">
        {hint}
      </p>
    );
  }

  return null;
}
