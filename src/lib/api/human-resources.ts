import type { HumanResourceFormValues, OperativeRoleOption } from "@/components/admin/resources/resource-types";

export type HumanResourceRecord = {
  id: number; name: string; type: "HUMAN"; operative_role_id: number; is_active: boolean;
  created_at?: string; updated_at?: string;
};
export class ResourceApiError extends Error {
  constructor(message: string, public requiresConfirmation = false) { super(message); }
}
async function checked(path: string, options: RequestInit = {}) {
  const response = await fetch(`/api/admin/resources${path}`, {
    credentials: "same-origin", cache: "no-store", ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const fields = body.errors && typeof body.errors === "object" ? Object.values(body.errors).filter(Boolean).join(" ") : "";
    throw new ResourceApiError(response.status === 401 ? "La sesión expiró. Inicia sesión nuevamente." : fields || body.message || "No fue posible completar la operación.", response.status === 409 && body.requires_confirmation === true);
  }
  return response;
}
export async function listOperativeRoles(signal?: AbortSignal): Promise<OperativeRoleOption[]> {
  const response = await checked("/human/operative-roles", { signal });
  const body = await response.json();
  if (!Array.isArray(body.data?.roles)) throw new Error("Respuesta de roles inválida.");
  return body.data.roles;
}
export async function listHumanResources(status: "active" | "inactive", signal?: AbortSignal): Promise<HumanResourceRecord[]> {
  const records: HumanResourceRecord[] = [];
  for (let page = 1; ; page++) {
    const response = await checked(`/human?status=${status}&page=${page}&per_page=100`, { signal });
    const body = await response.json();
    if (!Array.isArray(body.data?.resources) || !Number.isFinite(body.metadata?.pagination?.total_records)) throw new Error("Respuesta de recursos inválida.");
    records.push(...body.data.resources);
    if (!body.data.resources.length || records.length >= body.metadata.pagination.total_records) return records;
  }
}
export async function getHumanResource(id: number): Promise<HumanResourceRecord> {
  const body = await (await checked(`/human/${id}`)).json();
  if (!body.data?.resource) throw new Error("No se encontró el recurso.");
  return body.data.resource;
}
export async function saveHumanResource(values: HumanResourceFormValues, id?: number, confirmDuplicate = false) {
  await checked(id === undefined ? "/human" : `/human/${id}`, {
    method: id === undefined ? "POST" : "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { ...values, name: values.name.trim(), ...(confirmDuplicate ? { confirm_duplicate: true } : {}) } }),
  });
}
export async function setHumanResourceActive(id: number, active: boolean) {
  await checked(`/human/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: { is_active: active } }) });
}

export type CatalogResource = Omit<HumanResourceRecord, "type" | "operative_role_id"> & {
  type: "HUMAN" | "MATERIAL" | "LOGISTIC"; operative_role_id?: number; quantity?: number; unit_cost?: number;
};
export async function listResourceCatalog(status: "active" | "inactive", signal?: AbortSignal): Promise<CatalogResource[]> {
  const rows: CatalogResource[] = [];
  for (let page = 1; ; page++) {
    const body = await (await checked(`?status=${status}&page=${page}&per_page=100`, {signal})).json();
    if (!Array.isArray(body.data?.resources) || !Number.isFinite(body.metadata?.pagination?.total_records)) throw new Error("Respuesta de recursos inválida.");
    rows.push(...body.data.resources);
    if (!body.data.resources.length || rows.length >= body.metadata.pagination.total_records) return rows;
  }
}
export async function getCatalogResource(resource: CatalogResource): Promise<CatalogResource> {
  const path = {HUMAN:"human", MATERIAL:"material", LOGISTIC:"logistic"}[resource.type];
  const body = await (await checked(`/${path}/${resource.id}`)).json();
  if (!body.data?.resource) throw new Error("No se encontró el recurso.");
  return body.data.resource;
}
