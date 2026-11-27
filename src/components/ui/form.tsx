import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

const CONTROL =
  "w-full rounded-lg border bg-white px-3 text-sm text-ink placeholder:text-muted/70 transition-colors focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:bg-cream disabled:text-muted";

function controlClass(error?: string, extra = "") {
  return `${CONTROL} ${error ? "border-danger" : "border-line"} ${extra}`;
}

type FieldProps = { label?: string; error?: string; hint?: ReactNode; required?: boolean; className?: string };

function Field({
  id,
  label,
  error,
  hint,
  required,
  className = "",
  children,
}: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label ? (
        <label htmlFor={id} className="block text-sm font-medium text-ink">
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: ReactNode) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

export function TextField({
  label,
  error,
  hint,
  required,
  className,
  id: idProp,
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const generated = useId();
  const id = idProp ?? generated;
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <input
        id={id}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={controlClass(error, "h-10")}
        {...props}
      />
    </Field>
  );
}

export function SelectField({
  label,
  error,
  hint,
  required,
  className,
  id: idProp,
  children,
  ...props
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const generated = useId();
  const id = idProp ?? generated;
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <select
        id={id}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={controlClass(error, "h-10")}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
}

export function TextAreaField({
  label,
  error,
  hint,
  required,
  className,
  id: idProp,
  ...props
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const generated = useId();
  const id = idProp ?? generated;
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <textarea
        id={id}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={controlClass(error, "min-h-24 py-2")}
        {...props}
      />
    </Field>
  );
}

export function Checkbox({
  label,
  className = "",
  ...props
}: { label: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`flex cursor-pointer items-start gap-2 text-sm ${className}`}>
      <input type="checkbox" className="mt-0.5 h-4 w-4 accent-wine" {...props} />
      <span>{label}</span>
    </label>
  );
}
