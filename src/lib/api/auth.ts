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
  user: LoginUser;
}

export async function login(
  credentials: LoginRequest,
): Promise<LoginResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "same-origin",
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
  user: LoginUser;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResponse> {
  const response = await fetch("/api/auth/change-password", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      password: currentPassword,
      new_password: newPassword,
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

export async function getFirstAccess(): Promise<{ firstAccess: boolean }> {
  const response = await fetch("/api/auth/first-access", {
    credentials: "same-origin",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = new Error("No fue posible verificar el primer acceso. Intenta iniciar sesión nuevamente.");
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  const result = await response.json();
  if (typeof result?.firstAccess !== "boolean") {
    throw new Error("El servidor no devolvió un estado de primer acceso válido.");
  }
  return result;
}
