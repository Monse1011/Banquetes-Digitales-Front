import { afterEach, describe, expect, it, vi } from "vitest";
import { getUsers, saveUser, changeUserStatus, resendUserCredentials } from "./users";
afterEach(() => vi.unstubAllGlobals());
describe("user API contracts", () => {
  it("reads users without fabricating missing timestamps", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ data: { users: [{ id: "1", employee_id: "001", full_name: "Administrador" }] }, metadata: { pagination: { total_records: 1 } } })));
    expect((await getUsers())[0]).toMatchObject({ id: 1, employee_id: "001", created_at: null, last_access: null });
  });
  it("sends editable values and uses the backend employee identifier", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ data: { user: { id: 2, employee_id: "12345" } } }, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const values = { full_name: "Persona Logistica", email: "persona@example.com", role: "LOGISTICS" as const };
    expect((await saveUser(values)).employee_id).toBe("12345");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ data: values });
  });
  it("accepts text and empty responses for status and credentials", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response("OK")).mockResolvedValueOnce(new Response(null, { status: 204 })));
    await expect(changeUserStatus(2, "INACTIVE")).resolves.toBeUndefined();
    await expect(resendUserCredentials(2)).resolves.toBeUndefined();
  });
  it("preserves the partial-success mail error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ message: "Usuario registrado, correo no enviado" }, { status: 502 })));
    await expect(saveUser({ full_name: "Persona Logistica", email: "persona@example.com", role: "LOGISTICS" })).rejects.toMatchObject({ status: 502, message: "Usuario registrado, correo no enviado" });
  });
});
