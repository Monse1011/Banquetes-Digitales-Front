// Catálogos de recursos y roles operativos (contrato §4.3).
import { api, readPagination, type Paginated } from "./http";

export type ResourceType = "HUMAN" | "MATERIAL" | "LOGISTIC";
export type InventoryType = "MATERIAL" | "LOGISTIC";

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  HUMAN: "Humano",
  MATERIAL: "Material",
  LOGISTIC: "Logístico",
};

const PATH: Record<ResourceType, string> = { HUMAN: "human", MATERIAL: "material", LOGISTIC: "logistic" };

export type Resource = {
  id: number;
  name: string;
  type: ResourceType;
  is_active: boolean;
  operative_role_id?: number | null;
  quantity?: number;
  unit_cost?: number;
  created_at?: string;
  updated_at?: string;
  deactivated_at?: string | null;
};

export type ResourceFilters = {
  type?: string;
  name?: string;
  status?: "active" | "inactive" | "";
  operative_role_id?: number | string;
  order?: "asc" | "desc";
  page?: number;
  per_page?: number;
};

async function list(path: string, filters: ResourceFilters): Promise<Paginated<Resource>> {
  const raw = await api<{ data: { resources: Resource[] } }>(path, { query: { sort_by: "name", ...filters } });
  const items = raw?.data?.resources ?? [];
  return { items, pagination: readPagination(raw, items.length) };
}

/** Catálogo global (todos los tipos, filtrable por `type`). */
export function listResources(filters: ResourceFilters) {
  return list("/api/admin/resources", filters);
}

export function listResourcesByType(type: ResourceType, filters: ResourceFilters) {
  return list(`/api/admin/resources/${PATH[type]}`, filters);
}

export async function getResource(type: ResourceType, id: number): Promise<Resource> {
  const raw = await api<{ data: { resource: Resource } }>(`/api/admin/resources/${PATH[type]}/${id}`);
  return raw.data.resource;
}

export type HumanInput = { name: string; operative_role_id: number };

/** 409 con `requires_confirmation` si hay un posible duplicado: reenviar con `confirmDuplicate`. */
export async function createHumanResource(input: HumanInput, confirmDuplicate = false): Promise<void> {
  await api("/api/admin/resources/human", {
    method: "POST",
    body: { data: { ...input, confirm_duplicate: confirmDuplicate } },
  });
}

export async function updateHumanResource(id: number, input: HumanInput): Promise<void> {
  await api(`/api/admin/resources/human/${id}`, { method: "PATCH", body: { data: input } });
}

export type InventoryInput = { name: string; quantity: number; unit_cost: number };

export async function createInventoryResource(type: InventoryType, input: InventoryInput): Promise<void> {
  await api(`/api/admin/resources/${PATH[type]}`, { method: "POST", body: { data: input } });
}

export async function updateInventoryResource(type: InventoryType, id: number, input: InventoryInput): Promise<void> {
  await api(`/api/admin/resources/${PATH[type]}/${id}`, { method: "PATCH", body: { data: input } });
}

export async function setResourceActive(type: ResourceType, id: number, isActive: boolean): Promise<void> {
  await api(`/api/admin/resources/${PATH[type]}/${id}`, { method: "PUT", body: { data: { is_active: isActive } } });
}

/** Baja lógica exclusiva de recursos logísticos. */
export async function deleteLogisticResource(id: number): Promise<void> {
  await api(`/api/admin/resources/logistic/${id}`, { method: "DELETE" });
}

export type OperativeRole = { id: number; name: string; is_active?: boolean };

export async function listOperativeRoles(): Promise<OperativeRole[]> {
  const raw = await api<{ data: { roles: OperativeRole[] } }>("/api/admin/resources/operative-roles");
  return raw?.data?.roles ?? [];
}

export async function createOperativeRole(name: string): Promise<void> {
  await api("/api/admin/resources/operative-roles", { method: "POST", body: { data: { name } } });
}

export async function updateOperativeRole(id: number, name: string): Promise<void> {
  await api(`/api/admin/resources/operative-roles/${id}`, { method: "PATCH", body: { data: { name } } });
}

export async function deleteOperativeRole(id: number): Promise<void> {
  await api(`/api/admin/resources/operative-roles/${id}`, { method: "DELETE" });
}
