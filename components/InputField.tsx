import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';

const CONTROL =
  'w-full rounded-control border border-line-strong/60 bg-surface px-3 text-base text-ink ' +
  'placeholder:text-ink-3 transition-colors duration-150 hover:border-line-strong ' +
  'focus:border-accent focus:outline-2 focus:outline-offset-0 focus:outline-accent/35 ' +
  'aria-[invalid=true]:border-danger disabled:bg-sunken';

interface FieldShellProps {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  aside?: ReactNode;
  children: ReactNode;
}

function FieldShell({ id, label, hint, error, required, aside, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
          {required && (
            <span aria-hidden="true" className="ml-0.5 text-danger">
              *
            </span>
          )}
        </label>
        {aside}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface BaseProps {
  label: string;
  hint?: ReactNode;
  error?: string;
  aside?: ReactNode;
}

type InputFieldProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;

/** Etiket, ipucu ve hata metni alana `useId` ile bağlıdır. */
export function InputField({
  label,
  hint,
  error,
  aside,
  id,
  className = '',
  ...props
}: InputFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;
  return (
    <FieldShell
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={props.required}
      aside={aside}
    >
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${CONTROL} h-11 ${className}`}
        {...props}
      />
    </FieldShell>
  );
}

type TextAreaFieldProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextAreaField({
  label,
  hint,
  error,
  aside,
  id,
  className = '',
  ...props
}: TextAreaFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;
  return (
    <FieldShell
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={props.required}
      aside={aside}
    >
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${CONTROL} min-h-28 resize-y py-2.5 leading-relaxed ${className}`}
        {...props}
      />
    </FieldShell>
  );
}

export const controlClass = CONTROL;
