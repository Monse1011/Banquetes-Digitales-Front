export type InventoryKind = "material" | "logistic";
export type InventoryValues = {
  name: string;
  quantity: number;
  unit_cost: number;
};
export type InventoryRecord = InventoryValues & {
  id: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

async function request(
  kind: InventoryKind,
  suffix = "",
  options: RequestInit = {},
) {
  const response = await fetch(`/api/admin/resources/${kind}${suffix}`, {
    credentials: "same-origin",
    cache: "no-store",
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const errors =
      body.errors && typeof body.errors === "object"
        ? Object.values(body.errors).filter(Boolean).join(" ")
        : "";
    throw new Error(
      response.status === 401
        ? "La sesión expiró. Inicia sesión nuevamente."
        : errors || body.message || "No fue posible completar la operación.",
    );
  }
  return response;
}
export async function listInventory(
  kind: InventoryKind,
  status: "active" | "inactive",
  signal?: AbortSignal,
): Promise<InventoryRecord[]> {
  const rows: InventoryRecord[] = [];
  for (let page = 1; ; page++) {
    const body = await (
      await request(kind, `?status=${status}&page=${page}&per_page=100`, {
        signal,
      })
    ).json();
    if (
      !Array.isArray(body.data?.resources) ||
      !Number.isFinite(body.metadata?.pagination?.total_records)
    )
      throw new Error("Respuesta de recursos inválida.");
    rows.push(...body.data.resources);
    if (
      !body.data.resources.length ||
      rows.length >= body.metadata.pagination.total_records
    )
      return rows;
  }
}
export async function getInventory(
  kind: InventoryKind,
  id: number,
): Promise<InventoryRecord> {
  const body = await (await request(kind, `/${id}`)).json();
  if (!body.data?.resource) throw new Error("No se encontró el recurso.");
  return body.data.resource;
}
export async function saveInventory(
  kind: InventoryKind,
  values: InventoryValues,
  id?: number,
) {
  await request(kind, id === undefined ? "" : `/${id}`, {
    method: id === undefined ? "POST" : "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: {
        name: values.name.trim(),
        quantity: values.quantity,
        unit_cost: values.unit_cost,
      },
    }),
  });
}
export async function setInventoryActive(
  kind: InventoryKind,
  id: number,
  active: boolean,
) {
  await request(kind, `/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { is_active: active } }),
  });
}
export function validInventory(values: InventoryValues): boolean {
  return (
    !!values.name.trim() &&
    values.name.trim().length <= 100 &&
    Number.isInteger(values.quantity) &&
    values.quantity >= 0 &&
    values.quantity <= 2147483647 &&
    Number.isFinite(values.unit_cost) &&
    values.unit_cost >= 0 &&
    values.unit_cost <= 9999999999.99 &&
    Math.round(values.unit_cost * 100) / 100 === values.unit_cost
  );
}
