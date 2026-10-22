import type { AssignedEvent } from "./assigned-event-types";

export const MOCK_ASSIGNED_EVENTS: AssignedEvent[] = [
  {
    id: 1,
    folio: "RES-001",
    status: "ASSIGNED",

    client_name: "María García",
    client_email: "maria@example.com",
    client_phone: "+52 55 1234 5678",

    event_date: "2026-06-15",
    start_time: "18:00",
    end_time: "23:00",
    location: "Salón Los Pinos Mérida",
    guest_count: 100,

    schedule_status: "PROPOSED",

    services: [
      {
        name: "Banquete y bebidas",
        resources: [
          {
            type: "HUMAN",
            name: "Rol Chef",
            quantity: 2,
          },
          {
            type: "MATERIAL",
            name: "Vajilla completa",
            quantity: 100,
          },
        ],
      },
      {
        name: "Barra de cocteles",
        resources: [
          {
            type: "HUMAN",
            name: "Rol Bartender",
            quantity: 1,
          },
        ],
      },
    ],
  },

  {
    id: 2,
    folio: "RES-002",
    status: "ASSIGNED",

    client_name: "Roberto Sánchez",
    client_email: "roberto@example.com",
    client_phone: "9991234567",

    event_date: "2026-06-22",
    start_time: "16:00",
    end_time: "22:00",
    location: "Hacienda Vista Hermosa",
    guest_count: 150,

    schedule_status: "PROPOSED",

    services: [
      {
        name: "Banquete y bebidas",
        resources: [
          {
            type: "HUMAN",
            name: "Rol Chef",
            quantity: 3,
          },
        ],
      },
    ],
  },

  {
    id: 3,
    folio: "RES-003",
    status: "COORDINATION_READY",

    client_name: "Ana Martínez",
    client_email: "ana@example.com",
    client_phone: "9992223344",

    event_date: "2026-06-28",
    start_time: "12:00",
    end_time: "17:00",
    location: "Hotel Fiesta",
    guest_count: 80,

    schedule_status: "CONFIRMED",

    services: [
      {
        name: "Servicio de personal",
        resources: [
          {
            type: "HUMAN",
            name: "Rol Mesero",
            quantity: 4,
          },
        ],
      },
    ],
  },

  {
    id: 4,
    folio: "RES-004",
    status: "COORDINATION_INCOMPLETE",

    client_name: "Luis Hernández",
    client_email: null,
    client_phone: "9993334455",

    event_date: "2026-07-05",
    start_time: "14:00",
    end_time: "20:00",
    location: "Jardín Real",
    guest_count: 120,

    schedule_status: "PROPOSED",

    services: [
      {
        name: "Decoración",
        resources: [
          {
            type: "MATERIAL",
            name: "Sillas doradas",
            quantity: 120,
          },
        ],
      },
    ],
  },

  {
    id: 5,
    folio: "RES-005",
    status: "CONFIRMED",

    client_name: "Patricia Flores",
    client_email: "patricia@example.com",
    client_phone: "9994445566",

    event_date: "2026-07-12",
    start_time: "19:00",
    end_time: "00:00",
    location: "Centro de Convenciones",
    guest_count: 200,

    schedule_status: "CONFIRMED",

    services: [
      {
        name: "Transporte",
        resources: [
          {
            type: "LOGISTIC",
            name: "Vehículo Van #1",
            quantity: 2,
          },
        ],
      },
    ],
  },

  {
    id: 6,
    folio: "RES-006",
    status: "PROPOSAL_GENERATED",

    client_name: "Fernanda Ruiz",
    client_email: "fernanda@example.com",
    client_phone: "9995556677",

    event_date: "2026-07-20",
    start_time: "17:00",
    end_time: "23:00",
    location: "Quinta Las Palmas",
    guest_count: 90,

    schedule_status: "CONFIRMED",

    services: [],
  },

  {
    id: 7,
    folio: "RES-007",
    status: "COMPLETED",

    client_name: "Gabriela Molina",
    client_email: "gabriela@example.com",
    client_phone: "9996667788",

    event_date: "2026-05-10",
    start_time: "17:00",
    end_time: "22:00",
    location: "Salón Imperial",
    guest_count: 75,

    schedule_status: "CONFIRMED",

    services: [],
  },

  {
    id: 8,
    folio: "RES-008",
    status: "CANCELLED",

    client_name: "Daniel Pech",
    client_email: null,
    client_phone: null,

    event_date: "2026-05-18",
    start_time: "18:00",
    end_time: "23:00",
    location: null,
    guest_count: 60,

    schedule_status: "PROPOSED",

    services: [],
  },
];