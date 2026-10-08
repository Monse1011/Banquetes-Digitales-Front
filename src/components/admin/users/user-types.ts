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
  created_at: string;
  updated_at: string;

  // Solo para representar al usuario de la sesión mientras estamos en mock.
  is_current_user?: boolean;
}

export interface UserFormValues {
  full_name: string;
  email: string;
  role: UserRole | "";
}