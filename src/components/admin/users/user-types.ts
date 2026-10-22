export type UserRole = "ADMIN" | "LOGISTICS";
export type UserStatus = "ACTIVE" | "INACTIVE";

export interface AdminUser {
  id: number;
  employee_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  last_access: string | null;
  created_at: string | null;
  updated_at: string | null;

  // Identifica al usuario de la sesión actual.
  is_current_user?: boolean;
}

export interface UserFormValues {
  full_name: string;
  email: string;
  role: UserRole | "";
}