import { ApiError, apiRequest } from "./http";
export interface LoginRequest {
  employeeId: string;
  password: string;
}
export interface LoginUser {
  id_user: string | number;
  id_employee: string;
  full_name: string;
  email: string;
  role: "ADMIN" | "LOGISTICS";
}
export interface LoginResponse {
  user: LoginUser;
}
export type ChangePasswordResponse = LoginResponse;
export const homeForRole = (role: LoginUser["role"]) =>
  role === "ADMIN" ? "/admin" : "/logistics";
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: credentials,
    auth: false,
    fallback: "No fue posible iniciar sesión.",
  });
}
export async function getFirstAccess(): Promise<{ firstAccess: boolean }> {
  const result = await apiRequest<{ firstAccess: boolean }>(
    "/api/auth/first-access",
  );
  if (typeof result.firstAccess !== "boolean")
    throw new Error("El servidor no pudo confirmar el primer acceso.");
  return result;
}
export async function changePassword(
  password: string,
  newPassword: string,
): Promise<ChangePasswordResponse> {
  return apiRequest("/api/auth/change-password", {
    method: "POST",
    body: { password, new_password: newPassword },
  });
}
export const forgotPassword = (email: string) =>
  apiRequest<{ message?: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: { email },
    auth: false,
  });
export const resetPassword = (token: string, newPassword: string) =>
  apiRequest("/api/auth/reset-password", {
    method: "POST",
    body: { token, new_password: newPassword },
    auth: false,
  });

export async function getSession(): Promise<LoginResponse | null> {
  try {
    const result = await apiRequest<LoginResponse & { firstAccess: boolean }>(
      "/api/auth/session", { auth: false },
    );
    if (result.firstAccess) return null;
    if (!result.user || !["ADMIN", "LOGISTICS"].includes(result.user.role))
      throw new Error("El servidor devolvió una sesión no válida.");
    return result;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}
export const logout = () => apiRequest("/api/auth/logout", { method: "POST", auth: false });
