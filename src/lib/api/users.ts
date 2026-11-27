// Gestión de usuarios del sistema (contrato §4.2).
import type { UserRole } from "./auth";
import { api, readPagination, type Paginated } from "./http";

export type UserStatus = "ACTIVE" | "INACTIVE";

export type SystemUser = {
  id: number;
  employee_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};

export type SystemUserDetail = SystemUser & {
  last_access?: string | null;
  created_at?: string;
  updated_at?: string;
  /** Extensión del back: solicitudes a cargo del usuario. */
  assigned_requests?: { id: string; folio: string; event_date: string; start_time: string; end_time: string; status: string }[];
};

export type UserFilters = { search?: string; role?: string; status?: string; page?: number; per_page?: number };

export async function listUsers(filters: UserFilters): Promise<Paginated<SystemUser>> {
  const raw = await api<{ data: { users: SystemUser[] } }>("/api/admin/users", { query: filters });
  const items = raw?.data?.users ?? [];
  return { items, pagination: readPagination(raw, items.length) };
}

export async function getUser(id: number): Promise<SystemUserDetail> {
  const raw = await api<{ data: { user: SystemUserDetail } }>(`/api/admin/users/${id}`);
  return raw.data.user;
}

export type UserInput = { full_name: string; email: string; role: UserRole };

export async function createUser(input: UserInput): Promise<SystemUser> {
  const raw = await api<{ data: { user: SystemUser } }>("/api/admin/users", { method: "POST", body: { data: input } });
  return raw.data.user;
}

export async function updateUser(id: number, input: Partial<UserInput>): Promise<SystemUser> {
  const raw = await api<{ data: { user: SystemUser } }>(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: { data: input },
  });
  return raw?.data?.user;
}

export async function setUserStatus(id: number, status: UserStatus): Promise<void> {
  await api(`/api/admin/users/${id}`, { method: "PUT", body: { data: { status } } });
}

export async function resendCredentials(id: number): Promise<void> {
  await api(`/api/admin/users/${id}/credentials`, { method: "POST" });
}
