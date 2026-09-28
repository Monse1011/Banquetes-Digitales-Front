import type { ReservationFormState } from "./reservation-form";

export function validateReservationForm(form: ReservationFormState) {
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

  return errors;
}