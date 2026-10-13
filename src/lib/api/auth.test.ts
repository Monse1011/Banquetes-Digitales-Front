import { afterEach, describe, expect, it, vi } from "vitest";
import { changePassword, getFirstAccess, login } from "./auth";

const user = { id_user: 1, id_employee: "EMP-001", full_name: "Usuario de prueba", email: "test@example.com", role: "admin" };

function mockJson(body: unknown, status = 200) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }),
  );
}

afterEach(() => vi.restoreAllMocks());

describe("contrato de autenticación por cookie", () => {
  it("acepta login sin token en el cuerpo y usa el mismo origen", async () => {
    const fetchMock = mockJson({ user });
    await expect(login({ employeeId: "EMP-001", password: "test-password" })).resolves.toEqual({ user });
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: "EMP-001", password: "test-password" }),
    });
  });

  it.each([true, false])("consulta firstAccess=%s sin reutilizar caché", async (firstAccess) => {
    const fetchMock = mockJson({ firstAccess });
    await expect(getFirstAccess()).resolves.toEqual({ firstAccess });
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/first-access", {
      credentials: "same-origin", cache: "no-store",
    });
  });

  it("rechaza una consulta de primer acceso sin sesión", async () => {
    mockJson({ message: "Sin sesión" }, 401);
    await expect(getFirstAccess()).rejects.toMatchObject({ status: 401 });
  });

  it.each([{}, { firstAccess: "false" }])("rechaza un estado de primer acceso inválido: %j", async (body) => {
    mockJson(body);
    await expect(getFirstAccess()).rejects.toThrow("estado de primer acceso válido");
  });

  it("envía password y new_password sin Bearer", async () => {
    const fetchMock = mockJson({ user });
    await expect(changePassword("old-test", "new-test")).resolves.toEqual({ user });
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/change-password", {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "old-test", new_password: "new-test" }),
    });
  });

  it("conserva el rechazo de contraseña del backend", async () => {
    mockJson({ message: "Contraseña inválida" }, 400);
    await expect(changePassword("old-test", "new-test")).rejects.toMatchObject({ status: 400, message: "Contraseña inválida" });
  });

  it("conserva el estado de cuenta bloqueada", async () => {
    mockJson({ message: "Cuenta bloqueada" }, 423);
    await expect(login({ employeeId: "EMP-001", password: "test" })).rejects.toMatchObject({ status: 423 });
  });
});
