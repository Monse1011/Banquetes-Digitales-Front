// Calendario de eventos: global del admin (§4.3.5) y del responsable de logística (§5.4.1).
import { api, readPagination, type Paginated } from "./http";

export type CalendarEvent = {
  event_id: number;
  request_id: number;
  folio: string;
  title: string;
  logistics_responsible: { user_id: number; full_name: string } | null;
  /** `YYYY-MM-DD HH:mm:ss`, hora local de Mérida. */
  start_datetime: string;
  end_datetime: string;
  location: string;
  status: string;
  sync_status: string;
};

export type CalendarScope = "admin" | "logistics";

export type CalendarFilters = { date?: string; include_cancelled?: boolean; page?: number; per_page?: number };

export async function listCalendarEvents(scope: CalendarScope, filters: CalendarFilters): Promise<Paginated<CalendarEvent>> {
  const raw = await api<{ data: { events: CalendarEvent[] } }>(`/api/${scope}/calendar`, { query: filters });
  const items = raw?.data?.events ?? [];
  return { items, pagination: readPagination(raw, items.length) };
}

/** El contrato usa SYNCED/PENDING; el back responde "Sincronizado" / "Pendiente de sincronización". */
export function isSynced(syncStatus: string | null | undefined): boolean {
  const value = (syncStatus ?? "").toUpperCase();
  return value === "SYNCED" || value === "SINCRONIZADO";
}
