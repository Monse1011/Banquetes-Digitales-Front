// Reglas replicadas del back para dar retroalimentación inmediata. El back sigue siendo la fuente de verdad.
import { addDays, endsNextDay, meridaToIso, todayInMerida } from "./format";

/** domain/value-objects/password.js */
export function validatePassword(password: string): string | undefined {
  if (!password) return "La contraseña es obligatoria";
  if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres";
  if (!/[A-Z]/.test(password)) return "La contraseña debe contener al menos una letra mayúscula";
  if (!/[a-z]/.test(password)) return "La contraseña debe contener al menos una letra minúscula";
  if (!/[0-9]/.test(password)) return "La contraseña debe contener al menos un número";
  if (!/[!@#$%^&*(),.?": {}|<>_\-\\[\]/'`~+=;]/.test(password)) {
    return "La contraseña debe contener al menos un carácter especial";
  }
  return undefined;
}

export const PASSWORD_RULES = [
  { label: "Al menos 8 caracteres", test: (p: string) => p.length >= 8 },
  { label: "Una mayúscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Una minúscula", test: (p: string) => /[a-z]/.test(p) },
  { label: "Un número", test: (p: string) => /[0-9]/.test(p) },
  { label: "Un carácter especial", test: (p: string) => /[!@#$%^&*(),.?": {}|<>_\-\\[\]/'`~+=;]/.test(p) },
];

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const FULL_NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:\s[A-Za-zÀ-ÖØ-öø-ÿ]+)+$/;
/** Nombres de rol y de persona: el back exige al menos una letra. */
export const hasLetter = (value: string) => /\p{L}/u.test(value);

/** Precio por hora: número > 0 con máximo 2 decimales (mismo mensaje que el back). */
export const PRICE_ERROR = "El precio por hora es obligatorio y debe ser un número mayor a 0 con máximo 2 decimales.";
export const isValidPrice = (value: string) => /^\d+(\.\d{1,2})?$/.test(value.trim()) && Number(value) > 0;

export const PHONE_REGEX = /^\d{10}$/;
export const FOLIO_REGEX = /^BD-\d{4}-\d{5}$/;

export function normalizeFolio(value: string): string {
  return value.trim().toUpperCase();
}

export type ReservationForm = {
  client_full_name: string;
  email: string;
  phone: string;
  event_date: string;
  start_time: string;
  end_time: string;
  guest_count: string;
  event_address: string;
  services_ids: number[];
};

export type ReservationPayload = {
  client_full_name: string;
  email: string;
  phone: string;
  event_date_time: string;
  event_end_time: string;
  guest_count: number;
  event_address: string;
  services_ids: number[];
};

/** Errores con las mismas claves que devuelve el 422 del back. */
export function validateReservation(form: ReservationForm, today = todayInMerida()): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = form.client_full_name.trim().replace(/\s+/g, " ");
  if (!FULL_NAME_REGEX.test(name)) {
    errors.client_full_name = "Ingrese nombre y apellido usando solo letras.";
  }
  if (!EMAIL_REGEX.test(form.email.trim())) {
    errors.email = "Ingrese una dirección de correo válida. Ejemplo: nombre@dominio.com";
  }
  if (!PHONE_REGEX.test(form.phone.trim())) {
    errors.phone = "El número debe contener solo dígitos y tener 10 caracteres.";
  }
  if (!form.event_date || !form.start_time || form.event_date < today) {
    errors.event_date_time = "Seleccione una fecha válida. No puede ser anterior a la fecha actual.";
  }
  // Si la hora de fin no es posterior a la de inicio, el evento termina al día siguiente (el back valida el resto).
  if (!form.end_time) {
    errors.event_end_time = "Seleccione una hora de fin.";
  }
  const guests = Number(form.guest_count);
  if (!Number.isInteger(guests) || guests <= 0) {
    errors.guest_count = "Ingrese un número entero mayor a cero.";
  }
  if (!form.event_address.trim()) {
    errors.event_address = "La dirección del evento es obligatoria.";
  }
  if (form.services_ids.length === 0) {
    errors.services_ids = "Debe seleccionar al menos un servicio para continuar.";
  }
  return errors;
}

export function toReservationPayload(form: ReservationForm): ReservationPayload {
  return {
    client_full_name: form.client_full_name.trim().replace(/\s+/g, " "),
    email: form.email.trim(),
    phone: form.phone.trim(),
    event_date_time: meridaToIso(form.event_date, form.start_time),
    event_end_time: meridaToIso(eventEndDate(form), form.end_time),
    guest_count: Number(form.guest_count),
    event_address: form.event_address.trim(),
    services_ids: form.services_ids,
  };
}

/** Día de fin del evento: el siguiente si la hora de fin no es posterior a la de inicio. */
export function eventEndDate(form: Pick<ReservationForm, "event_date" | "start_time" | "end_time">): string {
  return endsNextDay(form.start_time, form.end_time) ? addDays(form.event_date, 1) : form.event_date;
}
