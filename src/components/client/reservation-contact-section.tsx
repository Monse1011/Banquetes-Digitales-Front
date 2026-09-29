import type { ReservationFormState } from "./reservation-form";

type ReservationContactSectionProps = {
  form: ReservationFormState;
  errors: Partial<Record<keyof ReservationFormState, string>>;
  touched: Record<string, boolean>;
  onUpdateField: (
    field: keyof ReservationFormState,
    value: string,
  ) => void;
};

export function ReservationContactSection({
  form,
  errors,
  touched,
  onUpdateField,
}: ReservationContactSectionProps) {
  return (
    <section className="rounded-sm border border-[#E8D8DB] bg-[#FDFAF8] p-6">
      <SectionHeader />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          label="Nombre Completo"
          required
          error={
            touched.client_full_name
              ? errors.client_full_name
              : undefined
          }
        >
          <input
            type="text"
            value={form.client_full_name}
            onChange={(event) =>
              onUpdateField("client_full_name", event.target.value)
            }
            placeholder="Ej. María García López"
            className={inputClass(
              !!errors.client_full_name && !!touched.client_full_name,
            )}
          />
        </FormField>

        <FormField
          label="Correo Electrónico"
          required
          error={touched.email ? errors.email : undefined}
        >
          <input
            type="email"
            value={form.email}
            onChange={(event) =>
              onUpdateField("email", event.target.value)
            }
            placeholder="correo@ejemplo.com"
            className={inputClass(!!errors.email && !!touched.email)}
          />
        </FormField>

        <FormField
          label="Teléfono (10 dígitos)"
          required
          error={touched.phone ? errors.phone : undefined}
        >
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={form.phone}
            onChange={(event) =>
              onUpdateField(
                "phone",
                event.target.value.replace(/\D/g, ""),
              )
            }
            placeholder="9991234567"
            className={inputClass(!!errors.phone && !!touched.phone)}
          />
        </FormField>

        <FormField
          label="Número de Invitados"
          required
          error={touched.guest_count ? errors.guest_count : undefined}
        >
          <input
            type="number"
            min={1}
            value={form.guest_count}
            onChange={(event) =>
              onUpdateField("guest_count", event.target.value)
            }
            placeholder="Ej. 100"
            className={inputClass(
              !!errors.guest_count && !!touched.guest_count,
            )}
          />
        </FormField>

        <div className="sm:col-span-2">
          <FormField
            label="Dirección del Evento"
            required
            error={
              touched.event_address
                ? errors.event_address
                : undefined
            }
          >
            <input
              type="text"
              value={form.event_address}
              onChange={(event) =>
                onUpdateField("event_address", event.target.value)
              }
              placeholder="Ej. Salón Los Pinos, Mérida, Yucatán"
              className={inputClass(
                !!errors.event_address && !!touched.event_address,
              )}
            />
          </FormField>
        </div>
      </div>
    </section>
  );
}

function SectionHeader() {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-[#6B2737] text-xs font-semibold text-white">
        01
      </span>

      <h2
        className="text-lg font-semibold text-[#2C1A1D]"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Datos de Contacto
      </h2>
    </div>
  );
}

function inputClass(hasError = false) {
  return [
    "w-full rounded-sm border bg-white px-4 py-3 text-sm",
    "text-[#2C1A1D] outline-none transition-all",
    "placeholder:text-[#B8A0A4]",
    hasError
      ? "border-[#C0392B] focus:border-[#C0392B]"
      : "border-[#D4BFC2] focus:border-[#6B2737]",
  ].join(" ");
}

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium tracking-[0.08em] text-[#5A3A3E] uppercase">
        {label}
        {required && <span className="ml-1 text-[#C0392B]">*</span>}
      </label>

      {children}

      {error && <p className="text-xs text-[#C0392B]">{error}</p>}
    </div>
  );
}