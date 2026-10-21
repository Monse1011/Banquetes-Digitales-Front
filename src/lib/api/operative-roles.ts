import type { OperativeRole } from "@/components/admin/operative-roles/operative-role-types";
import { getResourceRoles, listResources } from "./resources";

// The existing API exposes active roles only. No mutation endpoints are available.
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
