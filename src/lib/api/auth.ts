export interface LoginRequest {
  employeeId: string;
  password: string;
}

export interface LoginUser {
  id_user: string;
  id_employee: string;
  full_name: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  requiresPasswordChange: boolean;
  token: string;
  user: LoginUser;
}

export async function login(
  credentials: LoginRequest,
): Promise<LoginResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    let message = "No fue posible iniciar sesión";

    try {
      const data = await response.json();

      if (data?.message) {
        message = data.message;
      }
    } catch {
      // La respuesta no contiene JSON.
    }

    const error = new Error(message);
    (error as Error & { status?: number }).status = response.status;

    throw error;
  }

  return response.json();
}


export interface ChangePasswordResponse {
  requiresPasswordChange: false;
  token: string;
  user: LoginUser;
}

export async function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResponse> {
  const response = await fetch("/api/auth/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      currentPassword,
      newPassword,
    }),
  });

  if (!response.ok) {
    let message = "No fue posible cambiar la contraseña";

    try {
      const data = await response.json();

      if (data?.message) {
        message = data.message;
      }
    } catch {
      // La respuesta no contiene JSON.
    }

    const error = new Error(message);
    (error as Error & { status?: number }).status = response.status;

    throw error;
  }

  return response.json();
}