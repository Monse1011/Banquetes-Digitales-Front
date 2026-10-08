export type CalendarEventStatus =
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

export type CalendarSyncStatus =
  | "SYNCED"
  | "PENDING";

export interface CalendarResponsible {
  user_id: number;
  full_name: string;
}

export interface CalendarEvent {
  event_id: number;
  request_id: string;
  request_numeric_id: number;

  folio: string;
  client_name: string;
  title: string;

  logistics_responsible: CalendarResponsible;

  start_datetime: string;
  end_datetime: string;

  location: string;

  guest_count: number;

  status: CalendarEventStatus;
  sync_status: CalendarSyncStatus;

  google_event_id: string | null;
}