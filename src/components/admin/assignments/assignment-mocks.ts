import type {
  AssignmentRequest,
  AssignmentRequestDetail,
  AvailableLogisticsUser,
} from "./assignment-types";

export const MOCK_ASSIGNMENT_REQUESTS: AssignmentRequest[] = [
  {
    request_id: 1,
    folio: "RES-001",
    client_name: "María García López",
    event_date: "2026-06-15",
    start_time: "18:00",
    end_time: "23:00",
    event_address: "Salón Los Pinos Mérida",
    guest_count: 150,
  },
  {
    request_id: 2,
    folio: "RES-002",
    client_name: "Roberto Sánchez",
    event_date: "2026-06-22",
    start_time: "16:00",
    end_time: "22:00",
    event_address: "Hacienda Vista Hermosa",
    guest_count: 200,
  },
  {
    request_id: 3,
    folio: "RES-003",
    client_name: "Ana Martínez",
    event_date: "2026-06-28",
    start_time: "12:00",
    end_time: "17:00",
    event_address: "Hotel Fiesta",
    guest_count: 80,
  },
  {
    request_id: 4,
    folio: "RES-004",
    client_name: "Luis Hernández",
    event_date: "2026-07-05",
    start_time: "14:00",
    end_time: "20:00",
    event_address: "Salón La Casona",
    guest_count: 60,
  },
];

export const MOCK_ASSIGNMENT_REQUEST_DETAILS: Record<
  number,
  AssignmentRequestDetail
> = {
  1: {
    ...MOCK_ASSIGNMENT_REQUESTS[0],
    client_email: "maria@email.com",
    client_phone: "999 123 4567",
    selected_services: ["Banquete", "Barra", "Decoración"],
    event_type: null,
    status: "Aprobada",
  },

  2: {
    ...MOCK_ASSIGNMENT_REQUESTS[1],
    client_email: "roberto@email.com",
    client_phone: "999 234 5678",
    selected_services: ["Banquete", "Música"],
    event_type: null,
    status: "Aprobada",
  },

  3: {
    ...MOCK_ASSIGNMENT_REQUESTS[2],
    client_email: "ana@email.com",
    client_phone: "999 345 6789",
    selected_services: ["Banquete"],
    event_type: null,
    status: "Aprobada",
  },

  4: {
    ...MOCK_ASSIGNMENT_REQUESTS[3],
    client_email: "luis@email.com",
    client_phone: "999 456 7890",
    selected_services: ["Banquete", "Decoración"],
    event_type: null,
    status: "Aprobada",
  },
};

export const MOCK_AVAILABLE_LOGISTICS_USERS: AvailableLogisticsUser[] = [
  {
    id: 101,
    employee_id: 1001,
    full_name: "Juan Pérez",
    role: "Personal de Logística",
    status: "Activo",
    availability: "Disponible",
  },
  {
    id: 102,
    employee_id: 1002,
    full_name: "Ana López",
    role: "Personal de Logística",
    status: "Activo",
    availability: "No disponible",
    conflict: {
      folio: "RES-004",
      event_date: "2026-06-15",
      start_time: "17:00",
      end_time: "22:00",
    },
  },
  {
    id: 103,
    employee_id: 1003,
    full_name: "Carlos Ruiz",
    role: "Personal de Logística",
    status: "Activo",
    availability: "Disponible",
  },
];