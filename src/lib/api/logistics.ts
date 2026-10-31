// Módulo de logística (contrato §5). Los estados llegan como etiqueta en español
// ("Asignada", "Coordinación Lista"…); se normalizan con lib/status.
import { api, apiBlob, readPagination, type Paginated } from "./http";
import type { ResourceType } from "./resources";
import { addDays, toSqlDateTime } from "@/lib/format";

export type AssignedRequestSummary = {
  request_id: number;
  folio: string;
  client_name: string;
  client_email: string;
  event_date: string;
  start_time: string;
  end_time: string;
  event_address: string;
  guest_count: number;
  status: string;
};

type ListFilters = { status?: string; page?: number; per_page?: number };

async function listRequests(path: string, filters: ListFilters): Promise<Paginated<AssignedRequestSummary> & { message?: string }> {
  const raw = await api<{ data: { requests: AssignedRequestSummary[] }; message?: string }>(path, { query: filters });
  const items = raw?.data?.requests ?? [];
  return { items, pagination: readPagination(raw, items.length), message: raw?.message };
}

export function listAssignedRequests(filters: ListFilters) {
  return listRequests("/api/logistics/requests", filters);
}

/** `status`: "Finalizado" | "Cancelado" | "REJECTED" (contrato §5.1.2). */
export function listAssignedHistory(filters: ListFilters) {
  return listRequests("/api/logistics/requests/history", filters);
}

export type RequiredResource = { type: string; resource_or_operative_role: string; quantity: number };

export type ClientAdjustment = {
  id: number;
  proposals_code: string | null;
  version: number | null;
  observations: string;
  requested_at: string | null;
};

export type AssignedRequestDetail = {
  request_id: number;
  folio: string;
  client: { client_name: string; client_email: string; client_phone: string };
  event_date: string;
  start_time: string;
  end_time: string;
  schedule_type: string;
  event_address: string;
  guest_count: number;
  selected_services: { service_id: number; service_name: string; required_resources: RequiredResource[] }[];
  status: string;
  proposal_viewed_at: string | null;
  can_register_agreements: boolean;
  adjustments: ClientAdjustment[];
};

export async function getAssignedRequest(id: number | string): Promise<AssignedRequestDetail> {
  const raw = await api<{ data: AssignedRequestDetail }>(`/api/logistics/requests/${id}`);
  return raw.data;
}

// --- Confirmación de recursos (§5.2) ---

export type AvailabilityAssignment = {
  requested_quantity: number;
  assigned_quantity: number;
  available_quantity: number;
  sufficiency: string;
  status: string;
  observation: string | null;
};

export type AvailableResource = {
  id: number;
  name: string;
  type: ResourceType;
  is_active: boolean;
  operative_role_id?: number;
  operative_role?: string;
  quantity?: number;
  unit_cost?: number;
  available_quantity: number;
  assignment: AvailabilityAssignment | null;
};

export type AvailabilityRequestMeta = {
  request_id: number;
  folio: string;
  status: string;
  event_date: string;
  start_time: string;
  end_time: string;
  observations: string | null;
  pending_observations: string | null;
};

const TYPE_PATH: Record<ResourceType, string> = { HUMAN: "human", MATERIAL: "material", LOGISTIC: "logistic" };

export async function listAvailability(
  type: ResourceType,
  requestId: number | string,
  filters: { name?: string; page?: number; per_page?: number } = {},
): Promise<Paginated<AvailableResource> & { request: AvailabilityRequestMeta | null }> {
  const raw = await api<{
    data: { resources: AvailableResource[] };
    metadata?: { request?: AvailabilityRequestMeta };
  }>(`/api/logistics/resources/${TYPE_PATH[type]}`, { query: { request_id: requestId, ...filters } });
  const items = raw?.data?.resources ?? [];
  return { items, pagination: readPagination(raw, items.length), request: raw?.metadata?.request ?? null };
}

/** Ventana de uso por defecto = horario del evento (si termina antes de empezar, cruza medianoche). */
export function defaultUsageWindow(meta: AvailabilityRequestMeta) {
  const endDate = meta.end_time <= meta.start_time ? addDays(meta.event_date, 1) : meta.event_date;
  return { usage_start: toSqlDateTime(meta.event_date, meta.start_time), usage_end: toSqlDateTime(endDate, meta.end_time) };
}

export type ProvisionalItem = {
  resource_id: number;
  quantity: number;
  usage_start: string;
  usage_end: string;
  observation: string | null;
};

export async function assignProvisional(requestId: number | string, items: ProvisionalItem[], observations?: string | null) {
  await api(`/api/logistics/requests/${requestId}/resources`, {
    method: "POST",
    body: { data: items, observations: observations || null },
  });
}

export async function releaseProvisional(requestId: number | string, resourceId: number) {
  await api(`/api/logistics/requests/${requestId}/resources/${resourceId}`, { method: "DELETE" });
}

export type ConfirmationResult = {
  request_id: number;
  folio: string;
  previous_status: string;
  current_status: string;
  is_fully_sufficient: boolean;
  confirmed_by: string;
  confirmed_at: string;
  summary: { sufficient_resources: number; insufficient_resources: number };
};

export async function confirmResources(requestId: number | string, observations: string | null): Promise<ConfirmationResult> {
  const raw = await api<{ data: ConfirmationResult }>(`/api/logistics/requests/${requestId}/resources/confirm`, {
    method: "POST",
    body: { observations },
  });
  return raw.data;
}

export async function cancelProvisional(requestId: number | string): Promise<{ provisional_resources_released: number; message?: string }> {
  const raw = await api<{ data: { provisional_resources_released: number; message?: string } }>(
    `/api/logistics/requests/${requestId}/resources/cancel`,
    { method: "POST" },
  );
  return raw.data;
}

// --- Acuerdos y propuesta (§5.3) ---

export type AgreementResource = {
  resource_id: number;
  name: string;
  type: ResourceType;
  quantity: number;
  unit_cost: number | null;
  requested_quantity?: number;
  available_quantity?: number;
  sufficiency?: string;
};

export type Agreements = {
  derived_information_id: number | null;
  request_id: number;
  folio: string;
  status: string;
  client: { client_name: string; client_email: string; client_phone: string };
  location: string;
  start_datetime: string;
  end_datetime: string;
  event_date: string;
  end_date: string;
  observations: string | null;
  confirmation_observations: string | null;
  start_time: string;
  end_time: string;
  schedule_type: string;
  guest_count: number;
  can_register_agreements: boolean;
  assigned_resources: AgreementResource[];
};

export async function getAgreements(requestId: number | string): Promise<Agreements> {
  const raw = await api<{ data: Agreements }>(`/api/logistics/requests/${requestId}/derived-information`);
  return raw.data;
}

export type AgreementsInput = {
  location: string;
  start_datetime: string;
  end_datetime: string;
  observations: string | null;
  adjusted_resources: { resource_id: number; quantity: number }[];
  /** Revisión que el usuario tenía en pantalla (control de concurrencia). */
  derived_information_id: number | null;
};

export async function saveAgreements(requestId: number | string, input: AgreementsInput): Promise<number> {
  const raw = await api<{ data: { derived_information_id: number } }>(`/api/logistics/requests/${requestId}/derived-information`, {
    method: "POST",
    body: { data: input },
  });
  return raw.data.derived_information_id;
}

export type GeneratedProposal = {
  proposal_id: number;
  proposals_code: string;
  version?: number;
  name: string;
  creation_date: string;
  status: string;
  request_status?: string;
  pdf_url?: string;
};

export async function generateProposal(
  requestId: number | string,
  input: { derived_information_id: number; client_observations: string | null; discount_amount: number },
): Promise<GeneratedProposal> {
  const raw = await api<{ data: GeneratedProposal }>(`/api/logistics/requests/${requestId}/proposals`, {
    method: "POST",
    body: { data: input },
  });
  return raw.data;
}

export async function getGeneratedProposal(requestId: number | string): Promise<GeneratedProposal> {
  const raw = await api<{ data: GeneratedProposal }>(`/api/logistics/requests/${requestId}/proposals`);
  return raw.data;
}

export function downloadProposal(requestId: number | string) {
  return apiBlob(`/api/logistics/requests/${requestId}/proposals/download`);
}

export async function sendProposal(requestId: number | string): Promise<void> {
  await api(`/api/logistics/requests/${requestId}/proposals/send`, { method: "POST" });
}

// --- Calendario (§5.4) ---

export async function scheduleEvent(requestId: number | string) {
  const raw = await api<{ data: { event_id: number; sync_status: string } }>(`/api/logistics/requests/${requestId}/calendar`, {
    method: "POST",
  });
  return raw?.data;
}

export async function editEvent(eventId: number, input: { location: string; start_datetime: string; end_datetime: string }) {
  await api(`/api/logistics/calendar/${eventId}`, { method: "PATCH", body: { data: input } });
}

export async function cancelEvent(eventId: number) {
  await api(`/api/logistics/calendar/${eventId}`, { method: "DELETE" });
}

export async function retrySync(eventId: number): Promise<string | undefined> {
  const raw = await api<{ message?: string }>(`/api/logistics/calendar/${eventId}/sync`, { method: "POST" });
  return raw?.message;
}
