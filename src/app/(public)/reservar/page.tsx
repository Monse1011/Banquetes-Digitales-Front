"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Alert, Spinner } from "@/components/ui/feedback";
import { SelectField, TextAreaField, TextField } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { createReservation, getServices } from "@/lib/api/client";
import { ApiError, errorMessage } from "@/lib/api/http";
import { localParts, TIME_SLOTS } from "@/lib/format";
import { useQuery } from "@/lib/hooks";
import { DocumentTitle } from "@/components/ui/layout";
import { eventEndDate, toReservationPayload, validateReservation, type ReservationForm } from "@/lib/validation";

const EMPTY: ReservationForm = {
  client_full_name: "",
  email: "",
  phone: "",
  event_date: "",
  start_time: "",
  end_time: "",
  guest_count: "",
  event_address: "",
  services_ids: [],
};

function Section({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-2xl border border-line bg-white p-6 shadow-sm">
      <legend className="sr-only">{title}</legend>
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-wine text-sm font-semibold text-white">{number}</span>
        <h2 className="font-display text-xl font-semibold">{title}</h2>
      </div>
      {children}
    </fieldset>
  );
}

export default function ReservationPage() {
  const router = useRouter();
  const services = useQuery(getServices, "services");
  const [form, setForm] = useState<ReservationForm>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [busy, setBusy] = useState(false);
  // "Hoy" y "ahora" en hora de Mérida, no en la zona del navegador.
  const now = localParts(new Date());
  const today = now.date;
  const endDate = form.event_date && form.start_time && form.end_time ? eventEndDate(form) : "";

  const set = <K extends keyof ReservationForm>(key: K, value: ReservationForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      if (!e[key as string]) return e;
      const next = { ...e };
      delete next[key as string];
      return next;
    });
  };

  const toggleService = (id: number) =>
    set("services_ids", form.services_ids.includes(id) ? form.services_ids.filter((s) => s !== id) : [...form.services_ids, id]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError("");
    const found = validateReservation(form, today);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }
    setBusy(true);
    try {
      const folio = await createReservation(toReservationPayload(form));
      router.push(`/reservar/confirmacion?folio=${encodeURIComponent(folio)}`);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length > 0) {
        setErrors(err.fieldErrors);
        setSubmitError(err.message);
      } else {
        setSubmitError(errorMessage(err, "No fue posible enviar tu solicitud."));
      }
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="mb-8 text-center">
      <DocumentTitle title="Solicita tu evento" />
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-dark">Cotización sin costo</p>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Solicita tu evento</h1>
        <p className="mt-3 text-muted">
          Completa el formulario y recibirás un folio para dar seguimiento. Un coordinador te contactará para afinar los
          detalles.
        </p>
      </header>

      <form onSubmit={submit} noValidate className="space-y-6">
        <Section number={1} title="Tus datos">
          <TextField
            label="Nombre completo"
            placeholder="Nombre y apellido"
            autoComplete="name"
            value={form.client_full_name}
            onChange={(e) => set("client_full_name", e.target.value)}
            error={errors.client_full_name}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Correo electrónico"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              error={errors.email}
              required
            />
            <TextField
              label="Teléfono"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="10 dígitos"
              maxLength={10}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))}
              error={errors.phone}
              required
            />
          </div>
        </Section>

        <Section number={2} title="Tu evento">
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              label="Fecha"
              type="date"
              min={today}
              value={form.event_date}
              onChange={(e) => {
                set("event_date", e.target.value);
                setErrors((x) => ({ ...x, event_date_time: "" }));
              }}
              error={errors.event_date_time}
              required
            />
            <SelectField
              label="Hora de inicio"
              value={form.start_time}
              onChange={(e) => {
                set("start_time", e.target.value);
                setErrors((x) => ({ ...x, event_date_time: "" }));
              }}
              required
            >
              <option value="">Selecciona…</option>
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot} disabled={form.event_date === today && slot <= now.time}>
                  {slot}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Hora de término"
              value={form.end_time}
              onChange={(e) => {
                set("end_time", e.target.value);
                setErrors((x) => ({ ...x, event_end_time: "" }));
              }}
              error={errors.event_end_time}
              hint={endDate && endDate !== form.event_date ? `Termina el día siguiente (${endDate.slice(8, 10)}/${endDate.slice(5, 7)})` : undefined}
              required
            >
              <option value="">Selecciona…</option>
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_3fr]">
            <TextField
              label="Invitados"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={form.guest_count}
              onChange={(e) => set("guest_count", e.target.value)}
              error={errors.guest_count}
              required
            />
            <TextAreaField
              label="Dirección del evento"
              placeholder="Lugar, calle, colonia y ciudad"
              rows={2}
              className="[&_textarea]:min-h-10"
              value={form.event_address}
              onChange={(e) => set("event_address", e.target.value)}
              error={errors.event_address}
              required
            />
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Icon name="clock" className="h-4 w-4" /> Horario de Mérida (UTC-6).
          </p>
        </Section>

        <Section number={3} title="Servicios">
          {services.loading ? (
            <div className="flex justify-center py-6 text-muted">
              <Spinner />
            </div>
          ) : services.error ? (
            <Alert tone="danger" action={<Button variant="secondary" size="sm" onClick={services.reload}>Reintentar</Button>}>
              No pudimos cargar los servicios.
            </Alert>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {(services.data ?? []).map((service) => {
                const checked = form.services_ids.includes(service.id);
                return (
                  <label
                    key={service.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition ${
                      checked ? "border-wine bg-wine/5" : "border-line hover:border-gold"
                    }`}
                  >
                    <input type="checkbox" className="h-4 w-4 accent-wine" checked={checked} onChange={() => toggleService(service.id)} />
                    {service.nombre}
                  </label>
                );
              })}
            </div>
          )}
          {errors.services_ids ? <p className="text-xs text-danger">{errors.services_ids}</p> : null}
        </Section>

        {submitError ? <Alert tone="danger">{submitError}</Alert> : null}

        <div className="flex flex-col items-center gap-3">
          <Button type="submit" size="lg" loading={busy} className="w-full sm:w-auto">
            Enviar solicitud
          </Button>
          <p className="text-center text-xs text-muted">
            Al enviar aceptas que te contactemos por correo o teléfono para dar seguimiento a tu solicitud.
          </p>
        </div>
      </form>
    </div>
  );
}

