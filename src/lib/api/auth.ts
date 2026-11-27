import { api, ApiError } from "./http";

export type UserRole = "ADMIN" | "LOGISTICS";

export type SessionUser = {
  id: number;
  employeeId: string;
  fullName: string;
  email: string;
  role: UserRole;
};

type RawUser = Record<string, unknown>;

/** Login/cambio de contraseña responden en camelCase y /session en snake_case (contrato §2). */
export function normalizeUser(raw: RawUser): SessionUser {
  return {
    id: Number(raw.id ?? raw.id_user),
    employeeId: String(raw.employeeId ?? raw.id_employee ?? raw.employee_id ?? ""),
    fullName: String(raw.fullName ?? raw.full_name ?? ""),
    email: String(raw.email ?? ""),
    role: String(raw.role) === "ADMIN" ? "ADMIN" : "LOGISTICS",
  };
}

export async function login(employeeId: string, password: string): Promise<SessionUser> {
  const response = await api<{ user: RawUser }>("/api/auth/login", {
    method: "POST",
    body: { employeeId, password },
    auth: false,
  });
  return normalizeUser(response.user);
}

export type Session = { user: SessionUser; firstAccess: boolean };

/** Devuelve `null` si no hay sesión activa (401). */
export async function getSession(signal?: AbortSignal): Promise<Session | null> {
  try {
    const response = await api<{ user: RawUser; firstAccess?: boolean }>("/api/auth/session", { auth: false, signal });
    return { user: normalizeUser(response.user), firstAccess: Boolean(response.firstAccess) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export async function getFirstAccess(): Promise<boolean> {
  const response = await api<{ firstAccess: boolean }>("/api/auth/first-access");
  return Boolean(response.firstAccess);
}

export async function logout(): Promise<void> {
  await api("/api/auth/logout", { method: "POST", auth: false }).catch(() => undefined);
}

export async function changePassword(password: string, newPassword: string): Promise<SessionUser> {
  const response = await api<{ user: RawUser }>("/api/auth/change-password", {
    method: "POST",
    body: { password, new_password: newPassword },
  });
  return normalizeUser(response.user);
}

export async function forgotPassword(email: string): Promise<string> {
  const response = await api<{ message?: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: { email },
    auth: false,
  });
  return response?.message ?? "Si el correo está registrado, se enviaron las instrucciones para restablecer la contraseña.";
}

export async function resetPassword(token: string, newPassword: string): Promise<string> {
  const response = await api<{ message?: string }>("/api/auth/reset-password", {
    method: "POST",
    body: { token, new_password: newPassword },
    auth: false,
  });
  return response?.message ?? "Contraseña restablecida exitosamente.";
}
