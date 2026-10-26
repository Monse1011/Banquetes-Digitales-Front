import type { OperativeRole, OperativeRoleFormValues } from "@/components/admin/operative-roles/operative-role-types";
import { getResourceRoles, listResources } from "./resources";
import { apiRequest, ApiError } from "./http";

const path = "/api/admin/resources/operative-roles";

// The list endpoint returns active roles only; counts come from the human catalog.
export async function getActiveOperativeRoles(signal?: AbortSignal): Promise<OperativeRole[]> {
  const [roles, { resources }] = await Promise.all([
    getResourceRoles(signal),
    listResources("HUMAN", "active", undefined, signal),
  ]);
  const counts = new Map<number, number>();
  for (const resource of resources) {
    if (resource.operative_role_id !== undefined) {
      counts.set(resource.operative_role_id, (counts.get(resource.operative_role_id) ?? 0) + 1);
    }
  }
  return roles.map((role) => ({
    id: Number(role.id), name: role.name, is_active: true,
    active_human_resources_count: counts.get(Number(role.id)) ?? 0,
  }));
}

export async function getOperativeRole(id: number) {
  const response = await apiRequest<{
    data: { role: Pick<OperativeRole, "id" | "name" | "is_active"> };
  }>(`${path}/${id}`);
  return { ...response.data.role, id: Number(response.data.role.id) };
}

export function saveOperativeRole(values: OperativeRoleFormValues, id?: number) {
  return apiRequest(id === undefined ? path : `${path}/${id}`, {
    method: id === undefined ? "POST" : "PATCH",
    body: { data: { name: values.name.trim() } },
    responseType: "empty",
  });
}

export function deactivateOperativeRole(id: number) {
  return apiRequest(`${path}/${id}`, { method: "DELETE", responseType: "empty" });
}

export function operativeRoleError(error: unknown): string {
  if (error instanceof ApiError) {
    const errors = error.details.errors;
    if (errors && typeof errors === "object" && "name" in errors && typeof errors.name === "string") {
      return errors.name;
    }
  }
  return error instanceof Error ? error.message : "No se pudo completar la operación. Intenta de nuevo.";
}
