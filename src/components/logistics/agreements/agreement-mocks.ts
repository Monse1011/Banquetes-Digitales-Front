import type { AgreementEventData } from "./agreement-types";

export const MOCK_AGREEMENT_EVENTS: AgreementEventData[] = [
  {
    id: 3,
    folio: "RES-003",

    client_name: "Ana Martínez",
    client_email: "ana@example.com",
    client_phone: "999 123 4567",

    location: "Hotel Fiesta",
    start_date: "2026-06-28",
    start_time: "12:00",
    end_date: "2026-06-28",
    end_time: "17:00",

    confirmation_observations:
      "Coordinador no disponible para la fecha. Se sugiere reasignar o buscar alternativa.",

    human_resources: [
      {
        resource_id: 1,
        name: "Chef Juan Pérez",
        type: "HUMAN",
        requested_quantity: 2,
        assigned_quantity: 2,
        adjusted_quantity: 2,
        available_quantity: 3,
      },
      {
        resource_id: 2,
        name: "Mesera Ana López",
        type: "HUMAN",
        requested_quantity: 5,
        assigned_quantity: 5,
        adjusted_quantity: 5,
        available_quantity: 6,
      },
      {
        resource_id: 3,
        name: "Coord. Carlos Ruiz",
        type: "HUMAN",
        requested_quantity: 1,
        assigned_quantity: 0,
        adjusted_quantity: 0,
        available_quantity: 1,
      },
    ],

    material_resources: [
      {
        resource_id: 10,
        name: "Vajilla completa",
        type: "MATERIAL",
        requested_quantity: 100,
        assigned_quantity: 100,
        adjusted_quantity: 100,
        available_quantity: 120,
      },
      {
        resource_id: 11,
        name: "Sillas doradas",
        type: "MATERIAL",
        requested_quantity: 100,
        assigned_quantity: 80,
        adjusted_quantity: 80,
        available_quantity: 90,
      },
      {
        resource_id: 12,
        name: "Mesas redondas",
        type: "MATERIAL",
        requested_quantity: 20,
        assigned_quantity: 20,
        adjusted_quantity: 20,
        available_quantity: 25,
      },
    ],

    logistic_resources: [
      {
        resource_id: 20,
        name: "Vehículo Van #1",
        type: "LOGISTIC",
        requested_quantity: 1,
        assigned_quantity: 1,
        adjusted_quantity: 1,
        available_quantity: 2,
      },
      {
        resource_id: 21,
        name: "Carpa 10x10m",
        type: "LOGISTIC",
        requested_quantity: 2,
        assigned_quantity: 2,
        adjusted_quantity: 2,
        available_quantity: 3,
      },
    ],
  },

  {
    id: 4,
    folio: "RES-004",

    client_name: "Luis Hernández",
    client_email: "luis@example.com",
    client_phone: "999 555 8899",

    location: "Jardín Real",
    start_date: "2026-07-05",
    start_time: "14:00",
    end_date: "2026-07-05",
    end_time: "20:00",

    confirmation_observations:
      "Faltan recursos humanos por confirmar.",

    human_resources: [
      {
        resource_id: 4,
        name: "Rol Mesero",
        type: "HUMAN",
        requested_quantity: 4,
        assigned_quantity: 2,
        adjusted_quantity: 2,
        available_quantity: 4,
      },
    ],

    material_resources: [
      {
        resource_id: 13,
        name: "Sillas blancas",
        type: "MATERIAL",
        requested_quantity: 120,
        assigned_quantity: 120,
        adjusted_quantity: 120,
        available_quantity: 150,
      },
    ],

    logistic_resources: [],
  },
];