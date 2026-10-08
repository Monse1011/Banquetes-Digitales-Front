import type { CalendarEvent } from "./calendar-types";

export const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    event_id: 1,
    request_id: "uuu-id-2012",
    request_numeric_id: 1,

    folio: "RES-001",
    client_name: "María García López",
    title: "RES-001 - María García López",

    logistics_responsible: {
      user_id: 12,
      full_name: "Ana López",
    },

    start_datetime: "2026-10-15T18:00:00",
    end_datetime: "2026-10-15T23:00:00",

    location: "Hacienda Cocoyoc",

    guest_count: 150,

    status: "CONFIRMED",
    sync_status: "SYNCED",

    google_event_id: "gcal-12345",
  },

  {
    event_id: 2,
    request_id: "uuu-id-2013",
    request_numeric_id: 3,

    folio: "RES-003",
    client_name: "Ana Martínez",
    title: "RES-003 - Ana Martínez",

    logistics_responsible: {
      user_id: 12,
      full_name: "Ana López",
    },

    start_datetime: "2026-10-15T20:00:00",
    end_datetime: "2026-10-15T23:00:00",

    location: "Salón El Sol",

    guest_count: 220,

    status: "CONFIRMED",
    sync_status: "PENDING",

    google_event_id: null,
  },

  {
    event_id: 3,
    request_id: "uuu-id-2014",
    request_numeric_id: 5,

    folio: "RES-005",
    client_name: "Carlos Ramírez",
    title: "RES-005 - Carlos Ramírez",

    logistics_responsible: {
      user_id: 12,
      full_name: "Ana López",
    },

    start_datetime: "2026-10-22T17:00:00",
    end_datetime: "2026-10-22T22:00:00",

    location: "Jardín Real",

    guest_count: 90,

    status: "COMPLETED",
    sync_status: "SYNCED",

    google_event_id: "gcal-12347",
  },

  {
    event_id: 4,
    request_id: "uuu-id-2015",
    request_numeric_id: 6,

    folio: "RES-006",
    client_name: "Andrea Morales",
    title: "RES-006 - Andrea Morales",

    logistics_responsible: {
      user_id: 12,
      full_name: "Ana López",
    },

    start_datetime: "2026-10-24T16:00:00",
    end_datetime: "2026-10-24T21:00:00",

    location: "Quinta Montes Molina",

    guest_count: 120,

    status: "CANCELLED",
    sync_status: "SYNCED",

    google_event_id: null,
  },
];