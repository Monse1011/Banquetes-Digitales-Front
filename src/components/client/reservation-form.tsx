"use client";

import { FormEvent, useEffect, useState } from "react";
import { getClientServices, type ClientService } from "@/lib/api/client";
import { RequestSentConfirmation } from "./request-sent-confirmation";
import { validateReservationForm } from "./reservation-form-validation";
import { submitReservationForm } from "./reservation-form-submit";
import { ReservationServicesSection } from "./reservation-services-section";
import { ReservationFormFooter } from "./reservation-form-footer";
import { ReservationContactSection } from "./reservation-contact-section";


export type ReservationFormState = {
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

  const errors = validateReservationForm(form);
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    void submitReservationForm(event, form, isValid, isSubmitting, {
      setTouched,
      setSubmitError,
      setIsSubmitting,
      setSubmittedFolio,
    });
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
        <ReservationContactSection
          form={form}
          errors={errors}
          touched={touched}
          onUpdateField={updateField}
        />

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

        <ReservationServicesSection
          services={services}
          servicesLoading={servicesLoading}
          servicesError={servicesError}
          touched={!!touched.services_ids}
          error={errors.services_ids}
          selectedServiceIds={form.services_ids}
          onToggleService={toggleService}
        />
        {submitError && (
            <p className="text-sm text-[#C0392B]">
                {submitError}
            </p>
            )}

        <ReservationFormFooter
          isValid={isValid}
          isSubmitting={isSubmitting}
        />
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