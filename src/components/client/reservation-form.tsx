"use client";

import { FormEvent, useEffect, useState } from "react";
import { getClientServices, type ClientService, createReservationRequest } from "@/lib/api/client";
import { RequestSentConfirmation } from "./request-sent-confirmation";


type ReservationFormState = {
  client_full_name: string;
  email: string;
  phone: string;
  event_date: string;
  event_time: string;
  guest_count: string;
  event_address: string;
  services_ids: number[];
};

const initialForm: ReservationFormState = {
  client_full_name: "",
  email: "",
  phone: "",
  event_date: "",
  event_time: "",
  guest_count: "",
  event_address: "",
  services_ids: [],
};

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

function todayAsInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function ReservationForm() {
  const [form, setForm] = useState<ReservationFormState>(initialForm);
  const [services, setServices] = useState<ClientService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submittedFolio, setSubmittedFolio] = useState<string | null>(null);

  useEffect(() => {
    async function loadServices() {
      try {
        setServicesLoading(true);
        setServicesError("");

        const result = await getClientServices();
        setServices(result);
      } catch {
        setServicesError("No fue posible cargar los servicios disponibles.");
      } finally {
        setServicesLoading(false);
      }
    }

    loadServices();
  }, []);

  const errors: Record<string, string> = {};

  if (!form.client_full_name.trim()) {
    errors.client_full_name = "Campo obligatorio";
  }

  if (
    !form.email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  ) {
    errors.email = "Correo inválido";
  }

  if (!/^\d{10}$/.test(form.phone)) {
    errors.phone = "Debe contener 10 dígitos";
  }

  if (!form.event_date) {
    errors.event_date = "Selecciona una fecha";
  }

  if (!form.event_time) {
    errors.event_time = "Selecciona una hora";
  }

  if (!form.guest_count || Number(form.guest_count) < 1) {
    errors.guest_count = "Mínimo 1 invitado";
  }

  if (!form.event_address.trim()) {
    errors.event_address = "Campo obligatorio";
  }

  if (form.services_ids.length === 0) {
    errors.services_ids = "Selecciona al menos un servicio";
  }

  const isValid = Object.keys(errors).length === 0;

  function updateField(
    field: keyof ReservationFormState,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setTouched((current) => ({
      ...current,
      [field]: true,
    }));
  }

  function toggleService(serviceId: number) {
    setForm((current) => ({
      ...current,
      services_ids: current.services_ids.includes(serviceId)
        ? current.services_ids.filter((id) => id !== serviceId)
        : [...current.services_ids, serviceId],
    }));

    setTouched((current) => ({
      ...current,
      services_ids: true,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setTouched({
        client_full_name: true,
        email: true,
        phone: true,
        event_date: true,
        event_time: true,
        guest_count: true,
        event_address: true,
        services_ids: true,
    });

    if (!isValid || isSubmitting) {
        return;
    }

    setSubmitError("");
    setIsSubmitting(true);

    try {
        const eventDateTime = `${form.event_date}T${form.event_time}:00`;

        const response = await createReservationRequest({
        client_full_name: form.client_full_name.trim(),
        email: form.email.trim(),
        phone: form.phone,
        event_date_time: eventDateTime,
        guest_count: Number(form.guest_count),
        event_address: form.event_address.trim(),
        services_ids: form.services_ids,
        });

        setSubmittedFolio(response.data.folio);
    } catch (error) {
        setSubmitError(
        error instanceof Error
            ? error.message
            : "No fue posible enviar la solicitud.",
        );
    } finally {
        setIsSubmitting(false);
    }
    }
  if (submittedFolio) {
    return <RequestSentConfirmation folio={submittedFolio} />;
    }

  return (
    <main className="min-h-screen bg-[#F5EBE8]">
      <header className="border-b border-[#E8D8DB] bg-[#FDFAF8] px-4 py-8">
        <div className="mx-auto max-w-3xl text-center">
          <p
            className="text-xs font-medium tracking-[0.2em] text-[#6B2737] uppercase"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Banquetes Elegancia
          </p>

          <div className="mx-auto mt-3 mb-3 h-px w-32 bg-[#6B2737] opacity-30" />

          <h1
            className="text-2xl font-semibold text-[#2C1A1D]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Solicitud de Reservación
          </h1>

          <p
            className="mt-1 text-sm text-[#7A5055]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Complete todos los campos para enviar su solicitud de evento.
          </p>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 pb-28"
      >
        {/* Datos de contacto */}
        <section className="rounded-sm border border-[#E8D8DB] bg-[#FDFAF8] p-6">
          <SectionHeader number="01" title="Datos de Contacto" />

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
                  updateField("client_full_name", event.target.value)
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
                  updateField("email", event.target.value)
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
                  updateField(
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
                  updateField("guest_count", event.target.value)
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
                    updateField("event_address", event.target.value)
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

        {/* Fecha y hora */}
        <section className="rounded-sm border border-[#E8D8DB] bg-[#FDFAF8] p-6">
          <SectionHeader number="02" title="Fecha y Hora del Evento" />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField
              label="Fecha del Evento"
              required
              error={touched.event_date ? errors.event_date : undefined}
            >
              <input
                type="date"
                min={todayAsInputValue()}
                value={form.event_date}
                onChange={(event) =>
                  updateField("event_date", event.target.value)
                }
                className={inputClass(
                  !!errors.event_date && !!touched.event_date,
                )}
              />
            </FormField>

            <FormField
              label="Hora del Evento"
              required
              error={touched.event_time ? errors.event_time : undefined}
            >
              <input
                type="time"
                value={form.event_time}
                onChange={(event) =>
                  updateField("event_time", event.target.value)
                }
                className={inputClass(
                  !!errors.event_time && !!touched.event_time,
                )}
              />
            </FormField>
          </div>
        </section>

        {/* Servicios */}
        <section className="rounded-sm border border-[#E8D8DB] bg-[#FDFAF8] p-6">
          <SectionHeader number="03" title="Servicios Solicitados" />

          {touched.services_ids && errors.services_ids && (
            <p className="mb-3 text-xs text-[#C0392B]">
              {errors.services_ids}
            </p>
          )}

          {servicesLoading && (
            <p className="text-sm text-[#7A5055]">
              Cargando servicios disponibles...
            </p>
          )}

          {servicesError && (
            <p className="text-sm text-[#C0392B]">
              {servicesError}
            </p>
          )}

          {!servicesLoading && !servicesError && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {services.map((service) => {
                const checked = form.services_ids.includes(service.id);

                return (
                  <label
                    key={service.id}
                    className={[
                      "flex cursor-pointer select-none items-center gap-3",
                      "rounded-sm border px-4 py-3 transition-all",
                      checked
                        ? "border-[#6B2737] bg-[#F5EBE8]"
                        : "border-[#D4BFC2] bg-white hover:border-[#A0707A]",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleService(service.id)}
                      className="sr-only"
                    />

                    <div
                      className={[
                        "flex h-4 w-4 shrink-0 items-center justify-center",
                        "rounded-sm border transition-all",
                        checked
                          ? "border-[#6B2737] bg-[#6B2737]"
                          : "border-[#D4BFC2]",
                      ].join(" ")}
                    >
                      {checked && (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>

                    <span
                      className={[
                        "text-sm",
                        checked
                          ? "font-medium text-[#2C1A1D]"
                          : "text-[#5A3A3E]",
                      ].join(" ")}
                    >
                      {service.nombre}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </section>
        {submitError && (
            <p className="text-sm text-[#C0392B]">
                {submitError}
            </p>
            )}

        {/* Footer */}
        <div className="fixed inset-x-0 bottom-0 border-t border-[#E8D8DB] bg-[#FDFAF8] px-4 py-4 shadow-[0_-4px_20px_rgba(107,39,55,0.08)]">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <p className="text-xs text-[#9A7075]">
              {isValid ? (
                <span className="font-medium text-[#2D5A3D]">
                  Formulario completo, listo para enviar
                </span>
              ) : (
                "Complete todos los campos requeridos para continuar"
              )}
            </p>

            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={[
                "rounded-sm px-8 py-3 text-sm font-medium",
                "tracking-[0.06em] transition-all",
                isValid
                  ? "bg-[#6B2737] text-[#FDF6F0] shadow-[0_2px_12px_rgba(107,39,55,0.25)] hover:bg-[#4A1824]"
                  : "cursor-not-allowed bg-[#D4BFC2] text-[#9A7075]",
              ].join(" ")}
            >
              Enviar Solicitud
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}

function SectionHeader({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-[#6B2737] text-xs font-semibold text-white">
        {number}
      </span>

      <h2
        className="text-lg font-semibold text-[#2C1A1D]"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {title}
      </h2>
    </div>
  );
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