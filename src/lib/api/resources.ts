import { apiRequest } from "./http";
export type ResourceKind = "HUMAN" | "MATERIAL" | "LOGISTIC";
export const resourcePath = {
  HUMAN: "human",
  MATERIAL: "material",
  LOGISTIC: "logistic",
};
export const resourceLabel = {
  HUMAN: "Humanos",
  MATERIAL: "Materiales",
  LOGISTIC: "Logísticos",
};
export type Resource = {
  id: number;
  name: string;
  type: ResourceKind;
  is_active: boolean;
  operative_role_id?: number;
  operative_role?: string;
  quantity?: number;
  unit_cost?: number;
  created_at?: string;
  updated_at?: string;
  available_quantity?: number;
  assignment?: null | {
    requested_quantity: number;
    assigned_quantity: number;
    sufficiency: string;
    status: string;
    observation: string | null;
  };
};
export type ResourceValues = {
  name: string;
  operative_role_id?: number;
  quantity?: number;
  unit_cost?: number;
  confirm_duplicate?: boolean;
};
export type ResourceRequest = {
  event_date: string;
  start_time: string;
  end_time: string;
  folio: string;
  status: string;
  observations: string | null;
  pending_observations: string | null;
};
export async function listResources(
  type: ResourceKind,
  status: "active" | "inactive" = "active",
  requestId?: number,
  signal?: AbortSignal,
) {
  const resources: Resource[] = [];
  let request: ResourceRequest | undefined;
  for (let page = 1; ; page++) {
    const path =
      requestId === undefined
        ? "/api/admin/resources/"
        : "/api/logistics/resources/";
    const query = new URLSearchParams({
      status,
      page: String(page),
      per_page: "100",
    });
    if (requestId !== undefined) query.set("request_id", String(requestId));
    const response = await apiRequest<{
      data: { resources: Resource[] };
      metadata: {
        pagination: { total_records: number };
        request?: ResourceRequest;
      };
    }>(`${path}${resourcePath[type]}?${query}`, { signal });
    resources.push(
      ...response.data.resources.map((r) => ({
        ...r,
        id: Number(r.id),
        operative_role_id:
          r.operative_role_id == null ? undefined : Number(r.operative_role_id),
      })),
    );
    request = response.metadata.request;
    if (
      !response.data.resources.length ||
      resources.length >= response.metadata.pagination.total_records
    )
      return { resources, request };
  }
}
export async function getResource(resource: Resource) {
  const response = await apiRequest<{ data: { resource: Resource } }>(
    `/api/admin/resources/${resourcePath[resource.type]}/${resource.id}`,
  );
  return response.data.resource;
}
export async function getResourceRoles(signal?: AbortSignal) {
  const response = await apiRequest<{
    data: { roles: { id: number; name: string }[] };
  }>("/api/admin/resources/operative-roles", { signal });
  return response.data.roles;
}
export function saveResource(
  type: ResourceKind,
  data: ResourceValues,
  id?: number,
) {
  return apiRequest(
    `/api/admin/resources/${resourcePath[type]}${id === undefined ? "" : `/${id}`}`,
    {
      method: id === undefined ? "POST" : "PATCH",
      body: { data },
      responseType: "empty",
    },
  );
}
export function changeResourceStatus(resource: Resource) {
  return apiRequest(
    `/api/admin/resources/${resourcePath[resource.type]}/${resource.id}`,
    {
      method: "PUT",
      body: { data: { is_active: !resource.is_active } },
      responseType: "empty",
    },
  );
}
export function assignEventResource(
  requestId: number,
  resourceId: number,
  quantity: number,
  observation: string,
) {
  return apiRequest(`/api/logistics/requests/${requestId}/resources`, {
    method: "POST",
    body: { data: [{ resource_id: resourceId, quantity, observation }] },
    responseType: "empty",
  });
}
export function releaseEventResource(requestId: number, resourceId: number) {
  return apiRequest(
    `/api/logistics/requests/${requestId}/resources/${resourceId}`,
    { method: "DELETE", responseType: "empty" },
  );
}
export function confirmEventResources(requestId: number, observations: string) {
  return apiRequest<{ data: { current_status: string } }>(
    `/api/logistics/requests/${requestId}/resources/confirm`,
    { method: "POST", body: { observations } },
  );
}
export function cancelEventResources(requestId: number) {
  return apiRequest(`/api/logistics/requests/${requestId}/resources/cancel`, {
    method: "POST",
  });
}
