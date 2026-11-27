// Catálogo de gestión de promociones (contratos 6 a 10 del DAD incremento 4).
import { api, readPagination, type Paginated } from "./http";

export type PromotionStatus = "ACTIVE" | "INACTIVE";

export type Promotion = {
  id: number;
  name: string;
  description: string;
  discount_percentage: number;
  valid_until: string;
  status: PromotionStatus;
};

export type PromotionInput = {
  name: string;
  description: string;
  discount_percentage: number;
  valid_until: string;
};

export type PromotionFilters = { page?: number; per_page?: number };

export async function listPromotions(filters: PromotionFilters = {}): Promise<Paginated<Promotion>> {
  const raw = await api<{ data: { promotions: Promotion[] }; metadata?: unknown }>("/api/admin/promotions", {
    query: { ...filters },
  });
  const promotions = raw?.data?.promotions ?? [];
  return { items: promotions, pagination: readPagination(raw, promotions.length) };
}

export async function createPromotion(input: PromotionInput): Promise<void> {
  await api("/api/admin/promotions", { method: "POST", body: { data: input } });
}

/** Solo promociones vigentes; el mismo PUT con `{ status }` marca como no vigente (contrato 9). */
export async function updatePromotion(id: number, input: PromotionInput): Promise<void> {
  await api(`/api/admin/promotions/${id}`, { method: "PUT", body: { data: input } });
}

export async function deactivatePromotion(id: number): Promise<void> {
  await api(`/api/admin/promotions/${id}`, { method: "PUT", body: { data: { status: "INACTIVE" } } });
}

export async function deletePromotion(id: number): Promise<void> {
  await api(`/api/admin/promotions/${id}`, { method: "DELETE" });
}
