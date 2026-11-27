// Solicitudes de reservación para el administrador (contrato §4.1).
import { api, readPagination, type Paginated } from "./http";

export type LogisticUserRef = { id: number; full_name: string; email: string } | null;

export type AdminRequestSummary = {
  request_id: number;
  folio: string;
  client_name: string;
  client_email: string;
  requested_date: string;
  selected_services: string[];
  status: string;
  status_changed_at: string;
  event_date: string;
  start_time: string;
  end_time: string;
  actual_start_at: string | null;
  actual_end_at: string | null;
  event_address: string;
  guest_count: number;
  logistic_user: LogisticUserRef;
};

export type AssignmentInfo = {
  requested_quantity: number;
  assigned_quantity: number;
  available_quantity: number;
  sufficiency: string;
  status: string;
  observation: string | null;
};

export type AssignedResource = {
  id: number;
  name: string;
  type: string;
  operative_role_id?: number;
  operative_role?: string;
  assignment: AssignmentInfo;
};

export type AdminRequestDetail = {
  request_id: number;
  folio: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  guest_count: number;
  event_address: string;
  event_date_time: string;
  event_end_time: string;
  requested_date: string;
  actual_start_at: string | null;
  actual_end_at: string | null;
  status: string;
  status_changed_at: string;
  selected_services: string[];
  logistic_user: LogisticUserRef;
  event_observation: string | null;
  resource_assignments: { human: AssignedResource[]; material: AssignedResource[]; logistic: AssignedResource[] };
};

export type AdminRequestFilters = {
  active?: boolean;
  status?: string;
  search?: string;
  logistic_user_id?: number | string;
  event_date_from?: string;
  event_date_to?: string;
  page?: number;
  per_page?: number;
};

export async function listAdminRequests(filters: AdminRequestFilters): Promise<Paginated<AdminRequestSummary>> {
  const raw = await api<{ data: AdminRequestSummary[] }>("/api/admin/requests", { query: filters });
  const items = raw?.data ?? [];
  return { items, pagination: readPagination(raw, items.length) };
}

export async function getAdminRequest(id: number | string): Promise<AdminRequestDetail> {
  const raw = await api<{ data: AdminRequestDetail }>(`/api/admin/requests/${id}`);
  return raw.data;
}

export async function approveRequest(id: number | string): Promise<void> {
  await api(`/api/admin/requests/${id}`, { method: "PATCH", body: { status: "APPROVED" } });
}

/**
 * `currentLogisticUserId` es el responsable que el admin tenía en pantalla (control de
 * concurrencia optimista; el contrato lo nombra `request_id`). `null` si no había responsable.
 */
export async function assignLogisticUser(
  id: number | string,
  userId: number,
  currentLogisticUserId: number | null,
): Promise<void> {
  await api(`/api/admin/requests/${id}/assignment`, {
    method: "PATCH",
    body: { data: { user_id: userId, request_id: currentLogisticUserId } },
  });
}

export type AvailableLogisticUser = { id: number; employee_id: string; full_name: string };

export async function listAvailableLogisticUsers(): Promise<AvailableLogisticUser[]> {
  const raw = await api<{ data: { users: AvailableLogisticUser[] } }>("/api/admin/users/usersavailable");
  return raw?.data?.users ?? [];
}
