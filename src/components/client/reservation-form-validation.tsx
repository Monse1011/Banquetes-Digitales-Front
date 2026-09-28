import type { ReservationFormState } from "./reservation-form";

export function validateReservationForm(form: ReservationFormState) {
  const errors: Record<string, string> = {};

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
  } else {
    const selectedDate = new Date(`${form.event_date}T00:00:00`);

    if (selectedDate < today) {
      errors.event_date = "La fecha del evento no puede ser anterior a hoy.";
    }
  }

  if (!form.event_time) {
    errors.event_time = "Selecciona una hora";
  }

  const guestCount = Number(form.guest_count);

  if (!form.guest_count) {
    errors.guest_count = "Ingrese el número de invitados.";
  } else if (!Number.isInteger(guestCount) || guestCount < 1) {
    errors.guest_count =
      "El número de invitados debe ser un entero mayor a 0.";
  }

  if (!form.event_address.trim()) {
    errors.event_address = "Campo obligatorio";
  }

  if (form.services_ids.length === 0) {
    errors.services_ids = "Selecciona al menos un servicio";
  }

  return errors;
}