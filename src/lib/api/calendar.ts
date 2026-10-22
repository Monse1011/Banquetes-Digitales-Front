import { apiRequest } from "./http";
import type { CalendarEvent } from "@/components/logistics/calendar/calendar-types";

type CalendarRow = {
  event_id: number; request_id: number; folio: string; title: string;
  start_datetime: string; end_datetime: string; location: string;
  logistics_responsible: CalendarEvent["logistics_responsible"];
  status: string; sync_status: string;
};
const statuses: Record<string, CalendarEvent["status"]> = {
  Confirmado: "CONFIRMED", CONFIRMED: "CONFIRMED",
  Finalizado: "COMPLETED", FINISHED: "COMPLETED", COMPLETED: "COMPLETED",
  Cancelado: "CANCELLED", CANCELLED: "CANCELLED",
};
function mapEvent(row: CalendarRow): CalendarEvent {
  const status = statuses[row.status];
  if (!status) throw new Error(`Estado de calendario no reconocido: ${row.status}`);
  const sync = row.sync_status;
  if (!["Sincronizado", "SYNCED", "Pendiente de sincronización", "PENDING"].includes(sync))
    throw new Error(`Estado de sincronización no reconocido: ${sync}`);
  return {
    ...row, request_id: String(row.request_id), request_numeric_id: Number(row.request_id),
    status, sync_status: ["Sincronizado", "SYNCED"].includes(sync) ? "SYNCED" : "PENDING",
    start_datetime: row.start_datetime.replace(" ", "T"),
    end_datetime: row.end_datetime.replace(" ", "T"),
    google_event_id: null,
  };
}
export async function getCalendarEvents(admin: boolean, signal?: AbortSignal) {
  const events: CalendarEvent[] = [];
  const path = admin ? "/api/admin/calendar" : "/api/logistics/calendar";
  for (let page = 1; ; page++) {
    const result = await apiRequest<{ data: { events: CalendarRow[] }; metadata: { pagination: { total_records: number } } }>(
      `${path}?include_cancelled=true&page=${page}&per_page=100`, { signal },
    );
    events.push(...result.data.events.map(mapEvent));
    if (!result.data.events.length || events.length >= result.metadata.pagination.total_records) return events;
  }
}
export function confirmProposalAndSchedule(id: number) {
  return apiRequest<{ data: { event_id: number; request_id: number; status: string; sync_status: string } }>(
    `/api/logistics/requests/${id}/calendar`, { method: "POST" },
  );
}
// Datetimes are wall-clock values in America/Merida, as provided by the API.
export function eventOccupiesDay(event: Pick<CalendarEvent, "start_datetime" | "end_datetime">, day: string) {
  return event.start_datetime.slice(0, 10) <= day && event.end_datetime > `${day}T00:00:00`;
}

export type CalendarEdit = { location: string; start_datetime: string; end_datetime: string };
export function editCalendarEvent(id: number, values: CalendarEdit) {
  return apiRequest<void>(`/api/logistics/calendar/${id}`, {
    method: "PATCH", responseType: "empty", body: { data: values },
  });
}
export function cancelCalendarEvent(id: number) {
  return apiRequest<void>(`/api/logistics/calendar/${id}`, { method: "DELETE", responseType: "empty" });
}

export function retryCalendarSync(id: number) {
  return apiRequest<{ data: { event_id: number; sync_status: string }; message?: string | null }>(
    `/api/logistics/calendar/${id}/sync`, { method: "POST" },
  );
}
