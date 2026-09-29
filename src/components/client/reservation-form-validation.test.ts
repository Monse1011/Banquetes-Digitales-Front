import { describe, expect, it } from "vitest";
import type { ReservationFormState } from "./reservation-form";
import { validateReservationForm } from "./reservation-form-validation";

const validForm: ReservationFormState = {
  client_full_name: "Cliente de prueba",
  email: "cliente@test.com",
  phone: "9991234567",
  event_date: "2099-01-01",
  event_time: "20:00",
  guest_count: "2",
  event_address: "Dirección de prueba",
  services_ids: [1],
};

describe("validateReservationForm", () => {
  it("rechaza una fecha anterior a hoy", () => {
    const form = {
      ...validForm,
      event_date: "2020-01-01",
    };

    const errors = validateReservationForm(form);

    expect(errors.event_date).toBe(
      "La fecha del evento no puede ser anterior a hoy.",
    );
  });

  it("rechaza un número decimal de invitados", () => {
    const form = {
      ...validForm,
      guest_count: "2.5",
    };

    const errors = validateReservationForm(form);

    expect(errors.guest_count).toBe(
      "El número de invitados debe ser un entero mayor a 0.",
    );
  });

  it("rechaza cero invitados", () => {
    const form = {
      ...validForm,
      guest_count: "0",
    };

    const errors = validateReservationForm(form);

    expect(errors.guest_count).toBe(
      "El número de invitados debe ser un entero mayor a 0.",
    );
  });

  it("acepta un número entero positivo de invitados", () => {
    const form = {
      ...validForm,
      guest_count: "2",
    };

    const errors = validateReservationForm(form);

    expect(errors.guest_count).toBeUndefined();
  });
});