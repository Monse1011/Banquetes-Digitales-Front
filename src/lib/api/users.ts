import { apiRequest } from "./http";
import type { AdminUser, UserFormValues, UserStatus } from "@/components/admin/users/user-types";
function normalize(user: AdminUser): AdminUser {
  return { ...user, id: Number(user.id), last_access: user.last_access ?? null, created_at: user.created_at ?? null, updated_at: user.updated_at ?? null };
}
export async function getUsers(): Promise<AdminUser[]> {
  const users: AdminUser[] = [];
  for (let page = 1; ; page++) {
    const response = await apiRequest<{ data: { users: AdminUser[] }; metadata: { pagination: { total_records: number } } }>(`/api/admin/users?page=${page}&per_page=100`);
    users.push(...response.data.users.map(normalize));
    if (!response.data.users.length || users.length >= response.metadata.pagination.total_records) return users;
  }
}
export async function getUser(id: number): Promise<AdminUser> {
  const result = await apiRequest<{ data: { user: AdminUser } }>(`/api/admin/users/${id}`);
  return normalize(result.data.user);
}
export async function saveUser(values: UserFormValues, id?: number): Promise<AdminUser> {
  const result = await apiRequest<{ data: { user: AdminUser } }>(id === undefined ? "/api/admin/users" : `/api/admin/users/${id}`, { method: id === undefined ? "POST" : "PATCH", body: { data: values } });
  return normalize(result.data.user);
}
export async function changeUserStatus(id: number, status: UserStatus): Promise<void> {
  return apiRequest(`/api/admin/users/${id}`, { method: "PUT", body: { data: { status } }, responseType: "empty" });
}
export async function resendUserCredentials(id: number): Promise<void> {
  return apiRequest(`/api/admin/users/${id}/credentials`, { method: "POST", responseType: "empty" });
}
