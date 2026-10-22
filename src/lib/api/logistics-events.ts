import { getAssignmentDetail } from "./assignments";
import { apiRequest } from "./http";
import type { AssignedEvent, LogisticsEventStatus, ResourceType } from "@/components/logistics/events/assigned-event-types";

const statuses: Record<string, LogisticsEventStatus> = {
  ASIGNADA: "ASSIGNED", ASSIGNED: "ASSIGNED",
  "COORDINACION LISTA": "COORDINATION_READY", COORDINATION_READY: "COORDINATION_READY",
  "COORDINACION INCOMPLETA": "COORDINATION_INCOMPLETE", COORDINATION_INCOMPLETE: "COORDINATION_INCOMPLETE",
  "PROPUESTA GENERADA": "PROPOSAL_GENERATED", PROPUESTA_GENERADA: "PROPOSAL_GENERATED", PROPOSAL_GENERATED: "PROPOSAL_GENERATED",
  CONFIRMADO: "CONFIRMED", CONFIRMED: "CONFIRMED",
  FINALIZADO: "COMPLETED", FINISHED: "COMPLETED", COMPLETED: "COMPLETED",
  CANCELADO: "CANCELLED", CANCELLED: "CANCELLED", RECHAZADA: "REJECTED", REJECTED: "REJECTED",
};
function statusOf(value: string): LogisticsEventStatus {
  const status = statuses[value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase()];
  if (!status) throw new Error(`Estado de evento no reconocido: ${value}`);
  return status;
}
type Row = {
  request_id: number; folio: string; status: string;
  client_name?: string; client_email?: string; client_phone?: string;
  event_date: string; start_time: string; end_time: string; event_address: string | null; guest_count: number | null;
  client?: { client_name: string; client_email: string; client_phone: string };
  schedule_type?: string;
  selected_services?: { service_name: string; required_resources: { type: string; resource_or_operative_role: string; quantity: number }[] }[];
};
function mapEvent(row: Row): AssignedEvent {
  const status = statusOf(row.status);
  return {
    id: Number(row.request_id), folio: row.folio, status,
    client_name: row.client?.client_name ?? row.client_name ?? "Sin registrar",
    client_email: row.client?.client_email ?? row.client_email ?? null,
    client_phone: row.client?.client_phone ?? row.client_phone ?? null,
    event_date: row.event_date, start_time: row.start_time, end_time: row.end_time,
    location: row.event_address, guest_count: row.guest_count,
    schedule_status: row.schedule_type ? (row.schedule_type === "confirmado" ? "CONFIRMED" : "PROPOSED") : null,
    services: (row.selected_services ?? []).map((service) => ({ name: service.service_name, resources: (service.required_resources ?? []).map((resource) => {
      const type = resource.type.toUpperCase();
      if (!["HUMAN", "MATERIAL", "LOGISTIC"].includes(type)) throw new Error(`Tipo de recurso no reconocido: ${resource.type}`);
      return { type: type as ResourceType, name: resource.resource_or_operative_role, quantity: resource.quantity };
    }) })),
  };
}
export async function getLogisticsEvents(mode: "active" | "history", signal?: AbortSignal): Promise<AssignedEvent[]> {
  const events: AssignedEvent[] = [];
  const path = mode === "history" ? "/api/logistics/requests/history" : "/api/logistics/requests";
  for (let page = 1; ; page++) {
    const result = await apiRequest<{ data: { requests: Row[] }; metadata: { pagination: { total_records: number } } }>(`${path}?page=${page}&per_page=100`, { signal });
    events.push(...result.data.requests.map(mapEvent));
    if (!result.data.requests.length || events.length >= result.metadata.pagination.total_records) return events;
  }
}
export async function getLogisticsEvent(id: number, signal?: AbortSignal, admin = false): Promise<AssignedEvent> {
  if (admin) {
    const detail = await getAssignmentDetail(id);
    return mapEvent({...detail, selected_services: detail.selected_services.map((name) => ({service_name: name, required_resources: []}))});
  }
  const result = await apiRequest<{ data: Row }>(`/api/logistics/requests/${id}`, { signal });
  return mapEvent(result.data);
}
