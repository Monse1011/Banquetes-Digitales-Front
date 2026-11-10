// Catálogo de gestión de servicios (contratos 1 a 5 del DAD incremento 4).
import { api, readPagination, type Paginated } from "./http";

export type ServiceStatus = "ACTIVE" | "INACTIVE";

export type AdminService = {
  id: number;
  name: string;
  description: string;
  price: number;
  status: ServiceStatus;
};

export type ServiceInput = { name: string; description: string; price: number };

export type ServiceFilters = { page?: number; per_page?: number };

export async function listServices(filters: ServiceFilters = {}): Promise<Paginated<AdminService>> {
  const raw = await api<{ data: { services: AdminService[] }; metadata?: unknown }>("/api/admin/services", {
    query: { ...filters },
  });
  const services = raw?.data?.services ?? [];
  return { items: services, pagination: readPagination(raw, services.length) };
}

export async function createService(input: ServiceInput): Promise<void> {
  await api("/api/admin/services", { method: "POST", body: { data: input } });
}

export async function updateService(id: number, input: ServiceInput): Promise<void> {
  await api(`/api/admin/services/${id}`, { method: "PATCH", body: { data: input } });
}

/** Cambio de vigencia (ACTIVE ↔ INACTIVE); el alta y la eliminación tienen sus propios contratos. */
export async function setServiceStatus(id: number, status: ServiceStatus): Promise<void> {
  await api(`/api/admin/services/${id}`, { method: "PUT", body: { data: { status } } });
}

export async function deleteService(id: number): Promise<void> {
  await api(`/api/admin/services/${id}`, { method: "DELETE" });
}
