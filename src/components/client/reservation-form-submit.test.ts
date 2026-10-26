import { describe, expect, it, vi } from "vitest";
import type { FormEvent } from "react";
import { createReservationRequest } from "@/lib/api/client";
import { submitReservationForm } from "./reservation-form-submit";
vi.mock("@/lib/api/client", () => ({ createReservationRequest: vi.fn() }));

const form = {
  client_full_name: "Cliente Prueba", email: "cliente@example.com", phone: "9991234567",
  event_date: "2035-01-01", event_time: "20:00", event_end_date: "2035-01-02", event_end_time: "01:00",
  guest_count: "30", event_address: "Direccion prueba", services_ids: [1],
};
const event = { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>;
const handlers = () => ({ setTouched: vi.fn(), setSubmitError: vi.fn(), setIsSubmitting: vi.fn(), setSubmittedFolio: vi.fn() });

describe("reservation submission", () => {
  it("shows the folio from the backend array response", async () => {
    vi.mocked(createReservationRequest).mockResolvedValue({ data: [{ folio: "BD-2035-00001" }] });
    const callbacks = handlers();
    const result = await submitReservationForm(event, form, true, false, callbacks);
    expect(result.isValid).toBe(true);
    expect(callbacks.setSubmittedFolio).toHaveBeenCalledWith("BD-2035-00001");
    expect(callbacks.setIsSubmitting).toHaveBeenLastCalledWith(false);
  });
  it("does not send while a submission is pending", async () => {
    vi.mocked(createReservationRequest).mockClear();
    await submitReservationForm(event, form, true, true, handlers());
    expect(createReservationRequest).not.toHaveBeenCalled();
  });
  it("shows an error and allows retry after failure", async () => {
    vi.mocked(createReservationRequest).mockRejectedValue(new Error("Error de validación"));
    const callbacks = handlers();
    const result = await submitReservationForm(event, form, true, false, callbacks);
    expect(result.isValid).toBe(false);
    expect(callbacks.setSubmittedFolio).not.toHaveBeenCalled();
    expect(callbacks.setSubmitError).toHaveBeenCalledWith("Error de validación");
  });
});
