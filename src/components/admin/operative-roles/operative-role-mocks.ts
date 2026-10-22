import type { OperativeRole } from "./operative-role-types";

export const MOCK_OPERATIVE_ROLES: OperativeRole[] = [
  {
    id: 1,
    name: "Chef",
    is_active: true,
    active_human_resources_count: 4,
  },
  {
    id: 2,
    name: "Mesero",
    is_active: true,
    active_human_resources_count: 3,
  },
  {
    id: 3,
    name: "Bartender",
    is_active: true,
    active_human_resources_count: 1,
  },
  {
    id: 4,
    name: "Coordinador",
    is_active: true,
    active_human_resources_count: 2,
  },
  {
    id: 5,
    name: "Ayudante de cocina",
    is_active: true,
    active_human_resources_count: 1,
  },
  {
    id: 6,
    name: "Animación",
    is_active: false,
    active_human_resources_count: 0,
  },
];