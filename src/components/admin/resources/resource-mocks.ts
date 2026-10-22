import type {
  HumanResource,
  MaterialResource,
  OperativeRoleOption,
  LogisticResource,
  UnifiedResource,
} from "./resource-types";

export const MOCK_OPERATIVE_ROLES: OperativeRoleOption[] = [
  {
    id: 1,
    name: "Chef",
  },
  {
    id: 2,
    name: "Mesera",
  },
  {
    id: 3,
    name: "Coordinador",
  },
  {
    id: 4,
    name: "Ayudante de cocina",
  },
  {
    id: 5,
    name: "Personal de limpieza",
  },
];

export const MOCK_HUMAN_RESOURCES: HumanResource[] = [
  {
    id: 1,
    identifier: "RH-001",
    name: "Chef Juan Pérez",
    operative_role: {
      id: 1,
      name: "Chef",
    },
    is_active: true,
    assigned_to_event: true,
  },
  {
    id: 2,
    identifier: "RH-002",
    name: "Ana López",
    operative_role: {
      id: 2,
      name: "Mesera",
    },
    is_active: true,
    assigned_to_event: true,
  },
  {
    id: 3,
    identifier: "RH-003",
    name: "Carlos Ruiz",
    operative_role: {
      id: 3,
      name: "Coordinador",
    },
    is_active: true,
    assigned_to_event: false,
  },
  {
    id: 4,
    identifier: "RH-004",
    name: "Laura Díaz",
    operative_role: {
      id: 4,
      name: "Ayudante de cocina",
    },
    is_active: true,
    assigned_to_event: false,
  },
  {
    id: 5,
    identifier: "RH-005",
    name: "Pedro Gómez",
    operative_role: {
      id: 5,
      name: "Personal de limpieza",
    },
    is_active: false,
    assigned_to_event: false,
  },
];

export const MOCK_MATERIAL_RESOURCES: MaterialResource[] = [
  {
    id: 10,
    name: "Cable HDMI",
    type: "MATERIAL",
    quantity: 20,
    unit_cost: 150,
    operative_role_id: 1,
    is_active: true,
  },
  {
    id: 13,
    name: "Cable USB",
    type: "MATERIAL",
    quantity: 20,
    unit_cost: 150,
    operative_role_id: 1,
    is_active: true,
  },
];

export const MOCK_LOGISTIC_RESOURCES: LogisticResource[] = [
  {
    id: 20,
    name: "Camioneta",
    type: "LOGISTIC",
    quantity: 2,
    unit_cost: 1000,
    operative_role_id: 1,
    is_active: true,
  },
  {
    id: 22,
    name: "Mesas",
    type: "LOGISTIC",
    quantity: 4,
    unit_cost: 1000,
    operative_role_id: 1,
    is_active: true,
  },
];

export const MOCK_UNIFIED_RESOURCES: UnifiedResource[] = [
  {
    id: 1,
    identifier: "RH-001",
    name: "Chef Juan Pérez",
    type: "HUMAN",
    is_active: true,
    operative_role_name: "Chef",
    created_at: "2026-09-01T10:00:00Z",
    updated_at: "2026-09-20T15:30:00Z",
  },
  {
    id: 10,
    identifier: "MAT-001",
    name: "Vajilla completa",
    type: "MATERIAL",
    is_active: true,
    quantity: 120,
    unit_cost: 35,
    created_at: "2026-09-05T09:00:00Z",
    updated_at: "2026-09-18T11:15:00Z",
  },
  {
    id: 20,
    identifier: "LOG-001",
    name: "Vehículo Van #1",
    type: "LOGISTIC",
    is_active: true,
    quantity: 2,
    unit_cost: 1000,
    created_at: "2026-09-08T08:30:00Z",
    updated_at: "2026-09-25T13:20:00Z",
  },
  {
    id: 13,
    identifier: "MAT-002",
    name: "Sillas doradas",
    type: "MATERIAL",
    is_active: true,
    quantity: 80,
    unit_cost: 20,
    created_at: "2026-09-10T12:00:00Z",
    updated_at: "2026-09-22T17:10:00Z",
  },
  {
    id: 3,
    identifier: "RH-003",
    name: "Carlos Ruiz",
    type: "HUMAN",
    is_active: false,
    operative_role_name: "Mesero",
    created_at: "2026-08-20T10:40:00Z",
    updated_at: "2026-09-30T09:10:00Z",
  },
];