import type { FormEvent } from "react";
import type { ReservationFormState } from "./reservation-form";
import { createReservationRequest } from "@/lib/api/client";

type SubmitHandlers = {
  setTouched: (value: Record<string, boolean>) => void;
  setSubmitError: (value: string) => void;
  setIsSubmitting: (value: boolean) => void;
  setSubmittedFolio: (value: string | null) => void;
};

type SubmitResult = {
  isValid: boolean;
};

export async function submitReservationForm(
  event: FormEvent<HTMLFormElement>,
  form: ReservationFormState,
  isValid: boolean,
  isSubmitting: boolean,
  handlers: SubmitHandlers,
): Promise<SubmitResult> {
  event.preventDefault();

  handlers.setTouched({
    client_full_name: true,
    email: true,
    phone: true,
    event_date: true,
    event_time: true,
    event_end_date: true,
    event_end_time: true,
    guest_count: true,
    event_address: true,
    services_ids: true,
  });

  if (!isValid || isSubmitting) {
    return { isValid: false };
  }

  handlers.setSubmitError("");
  handlers.setIsSubmitting(true);

  try {
    const eventDateTime = `${form.event_date}T${form.event_time}:00`;

    const response = await createReservationRequest({
      client_full_name: form.client_full_name.trim(),
      email: form.email.trim(),
      phone: form.phone,
      event_date_time: new Date(eventDateTime).toISOString(),
      event_end_time: new Date(`${form.event_end_date}T${form.event_end_time}:00`).toISOString(),
      guest_count: Number(form.guest_count),
      event_address: form.event_address.trim(),
      services_ids: form.services_ids,
    });

    handlers.setSubmittedFolio(response.data[0].folio);

    return { isValid: true };
  } catch (error) {
    handlers.setSubmitError(
      error instanceof Error
        ? error.message
        : "No fue posible enviar la solicitud.",
    );

    return { isValid: false };
  } finally {
    handlers.setIsSubmitting(false);
  }
}