import { apiRequest, ApiError } from "./http";
import type { AssignmentRequest, AssignmentRequestDetail, AvailableLogisticsUser } from "@/components/admin/assignments/assignment-types";

type Page = { data: AssignmentRequest[]; metadata: { pagination: { total_records: number; per_page: number } } };
export async function getAssignmentRequests(status: "APPROVED" | "ASSIGNED" = "APPROVED"): Promise<AssignmentRequest[]> {
  const rows: AssignmentRequest[] = [];
  for (let page = 1; ; page++) {
    const result = await apiRequest<Page>(`/api/admin/requests?status=${status}&page=${page}&per_page=100`);
    rows.push(...result.data);
    if (!result.data.length || rows.length >= result.metadata.pagination.total_records) return rows;
  }
}
type Detail = Omit<AssignmentRequestDetail, "event_date" | "start_time" | "end_time" | "event_type"> & { event_date_time: string; event_end_time: string };
function dateParts(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Merida", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}
export async function getAssignmentDetail(id: number): Promise<AssignmentRequestDetail> {
  const result = await apiRequest<{ data: Detail[] }>(`/api/admin/requests/${id}`);
  const detail = result.data[0];
  if (!detail) throw new Error("No se encontró la solicitud.");
  const start = dateParts(detail.event_date_time);
  const end = dateParts(detail.event_end_time);
  return { ...detail, event_date: start.date, start_time: start.time, end_time: end.time, event_type: null };
}
export async function getEligibleLogisticsUsers(): Promise<AvailableLogisticsUser[]> {
  const result = await apiRequest<{ data: { users: { id: number; employee_id: string; full_name: string }[] } }>("/api/admin/users/usersavailable");
  return result.data.users.map((user) => ({ ...user, role: "Logística", status: "Activo", availability: "Elegible" }));
}
export async function assignRequest(requestId: number, userId: number): Promise<void> {
  return apiRequest(`/api/admin/requests/${requestId}/assignment`, { method: "PATCH", body: { data: { user_id: userId } }, responseType: "empty" });
}

export async function reassignRequest(requestId: number, userId: number, currentUserId: number): Promise<void> {
  // Existing backend contract: data.request_id is the expected CURRENT responsible's ID.
  return apiRequest(`/api/admin/requests/${requestId}/assignment`, {
    method: "PATCH", body: { data: { user_id: userId, request_id: currentUserId } }, responseType: "empty",
  });
}

export function assignmentError(error: unknown): string {
  const message = error instanceof Error ? error.message : "No se pudo guardar la asignación.";
  if (!(error instanceof ApiError)) return message;
  const conflict = error.details.conflict;
  if (conflict && typeof conflict === "object" && "folio" in conflict) {
    const details = conflict as Record<string, unknown>;
    return `${message} Conflicto: ${details.folio}, ${details.event_date}, ${details.start_time}–${details.end_time}. Selecciona otro responsable disponible o cancela para revisar la programación.`;
  }
  return error.status === 409 ? `${message} Cierra esta ventana y vuelve a abrir la solicitud para consultar sus datos actuales.` : message;
}
