import { apiRequest, ApiError } from "./http";
import type { ResourceKind } from "./resources";
export type AgreementResource = {
  resource_id: number;
  name: string;
  type: ResourceKind;
  quantity: number;
  requested_quantity?: number | null;
  available_quantity?: number | null;
  sufficiency?: string | null;
  observation?: string | null;
  unit_cost: number | null;
};
export type Agreement = {
  derived_information_id: number | null;
  request_id: number;
  folio: string;
  status: string;
  client: { client_name: string; client_email: string; client_phone: string };
  location: string;
  start_datetime: string;
  end_datetime: string;
  observations: string | null;
  confirmation_observations?: string | null;
  can_register_agreements: boolean;
  assigned_resources: AgreementResource[];
};
export type AgreementValues = {
  location: string;
  start: string;
  end: string;
  observations: string;
  quantities: Record<number, number>;
};
export function meridaInput(iso: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Merida",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
export async function getAgreements(id: number, signal?: AbortSignal) {
  const response = await apiRequest<{ data: Agreement }>(
    `/api/logistics/requests/${id}/derived-information`,
    { signal },
  );
  return response.data;
}
export function saveAgreements(
  id: number,
  values: AgreementValues,
  resources: AgreementResource[],
  agreementId?: number | null,
) {
  return apiRequest<{ data: { derived_information_id: number } }>(
    `/api/logistics/requests/${id}/derived-information`,
    {
      method: "POST",
      body: {
        data: {
          derived_information_id: agreementId,
          location: values.location.trim(),
          start_datetime: new Date(`${values.start}:00-06:00`).toISOString(),
          end_datetime: new Date(`${values.end}:00-06:00`).toISOString(),
          observations: values.observations,
          adjusted_resources: resources.map((r) => ({
            resource_id: r.resource_id,
            quantity: values.quantities[r.resource_id],
          })),
        },
      },
    },
  );
}
export function isAgreementRevisionConflict(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 409 &&
    error.details.code === "AGREEMENTS_REVISION_CHANGED"
  );
}
export function agreementError(error: unknown): string {
  if (!(error instanceof ApiError))
    return error instanceof Error
      ? error.message
      : "No se pudieron guardar los acuerdos.";
  const fields = error.details.errors;
  const messages =
    fields && typeof fields === "object"
      ? Object.values(fields).filter((v) => typeof v === "string")
      : [];
  const conflicts = Array.isArray(error.details.conflicts)
    ? error.details.conflicts
        .map((c) => {
          if (typeof c !== "object" || c === null) return "";
          if (typeof c.message === "string") return c.message;
          if (c.type === "resource") {
            const reasons: Record<string, string> = {
              overlap:
                "ocupado en el horario solicitado (incluye las tres horas posteriores)",
              insufficient_quantity: "cantidad disponible insuficiente",
              inactive: "inactivo",
              unavailable: "no disponible",
            };
            const folios = Array.isArray(c.folios)
              ? c.folios.filter((f: unknown) => typeof f === "string")
              : [];
            return `Recurso ${c.resource_name ?? c.resource_id ?? "sin identificar"}: ${reasons[c.reason] ?? "sin disponibilidad"}.${folios.length ? ` Eventos: ${folios.join(", ")}.` : ""}`;
          }
          if (c.type === "responsible") {
            return c.folio
              ? `Responsable ocupado en ${c.folio}${c.start_datetime && c.end_datetime ? `: ${c.start_datetime} – ${c.end_datetime} (horario de Mérida)` : ""}.`
              : "El responsable no está disponible.";
          }
          return c.folio
            ? `${c.folio}: ${c.event_date} ${c.start_time}–${c.end_time}`
            : "";
        })
        .filter(Boolean)
    : [];
  return [error.message, ...messages, ...conflicts].join(" ");
}
