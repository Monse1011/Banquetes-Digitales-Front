import type { ResourceConfirmationEvent } from "./resource-confirmation-types";

export const MOCK_RESOURCE_CONFIRMATIONS: ResourceConfirmationEvent[] = [
  {
    id: 1,
    folio: "RES-001",

    client_name: "María García López",

    event_date: "2026-06-15",
    start_time: "18:00",
    end_time: "23:00",

    schedule_status: "PROPOSED",

    guest_count: 150,

    services: [
      "Banquete",
      "Barra",
      "Decoración",
    ],

    status: "ASSIGNED",

    human_resources: [
      {
        id: 1,
        name: "Rol Chef",
        type: "HUMAN",

        operative_role: "Chef",

        requested_quantity: 2,
        available_quantity: 3,

        sufficiency: "SUFFICIENT",

        assigned_quantity: 0,
        is_assigned: false,

        observation: "",
      },
      {
        id: 2,
        name: "Rol Mesero",
        type: "HUMAN",

        operative_role: "Mesero",

        requested_quantity: 5,
        available_quantity: 5,

        sufficiency: "SUFFICIENT",

        assigned_quantity: 5,
        is_assigned: true,

        observation: "",
      },
      {
        id: 3,
        name: "Rol Coordinador",
        type: "HUMAN",

        operative_role: "Coordinador",

        requested_quantity: 1,
        available_quantity: 0,

        sufficiency: "INSUFFICIENT",

        assigned_quantity: 0,
        is_assigned: false,

        observation: "",
      },
    ],

    material_resources: [
      {
        id: 10,
        name: "Vajilla completa",
        type: "MATERIAL",

        requested_quantity: 100,
        available_quantity: 100,

        sufficiency: "SUFFICIENT",

        assigned_quantity: 100,
        is_assigned: true,

        observation: "",
      },
      {
        id: 11,
        name: "Sillas doradas",
        type: "MATERIAL",

        requested_quantity: 100,
        available_quantity: 80,

        sufficiency: "INSUFFICIENT",

        assigned_quantity: 0,
        is_assigned: false,

        observation: "",
      },
      {
        id: 12,
        name: "Mesas redondas",
        type: "MATERIAL",

        requested_quantity: 20,
        available_quantity: 20,

        sufficiency: "SUFFICIENT",

        assigned_quantity: 20,
        is_assigned: true,

        observation: "",
      },
    ],

    logistic_resources: [
      {
        id: 20,
        name: "Vehículo Van #1",
        type: "LOGISTIC",

        requested_quantity: 1,
        available_quantity: 1,

        sufficiency: "SUFFICIENT",

        assigned_quantity: 1,
        is_assigned: true,

        observation: "",
      },
      {
        id: 21,
        name: "Carpa 10x10m",
        type: "LOGISTIC",

        requested_quantity: 2,
        available_quantity: 2,

        sufficiency: "SUFFICIENT",

        assigned_quantity: 2,
        is_assigned: true,

        observation: "",
      },
    ],
  },
];