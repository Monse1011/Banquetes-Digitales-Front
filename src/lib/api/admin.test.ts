import { afterEach, describe, expect, it, vi } from "vitest";
import { approveRequest, assignLogisticUser, listAdminRequests } from "./admin-requests";
import { isSynced } from "./calendar";
import { ApiError } from "./http";
import { createHumanResource, listResourcesByType, setResourceActive } from "./resources";
import { createUser, listUsers, setUserStatus } from "./users";

afterEach(() => vi.unstubAllGlobals());

function mockFetch(status: number, body?: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(body === undefined ? null : JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const call = (fetchMock: ReturnType<typeof vi.fn>) => ({
  url: fetchMock.mock.calls[0][0] as string,
  method: fetchMock.mock.calls[0][1].method as string | undefined,
  body: fetchMock.mock.calls[0][1].body ? JSON.parse(fetchMock.mock.calls[0][1].body) : undefined,
});

describe("admin requests", () => {
  it("lista con filtros y paginación", async () => {
    const fetchMock = mockFetch(200, { data: [{ request_id: 1 }], metadata: { pagination: { total_records: 31, page: 2, per_page: 10 } } });
    const result = await listAdminRequests({ status: "PENDING", search: "", page: 2, per_page: 10 });
    expect(call(fetchMock).url).toBe("/api/admin/requests?status=PENDING&page=2&per_page=10");
    expect(result.pagination.total_records).toBe(31);
    expect(result.items).toHaveLength(1);
  });

  it("aprueba con el código del contrato", async () => {
    const fetchMock = mockFetch(200, { data: [] });
    await approveRequest(7);
    expect(call(fetchMock)).toEqual({ url: "/api/admin/requests/7", method: "PATCH", body: { status: "APPROVED" } });
  });

  it("envía el responsable actual para control de concurrencia", async () => {
    const fetchMock = mockFetch(200);
    await assignLogisticUser(1, 5, 2);
    expect(call(fetchMock).body).toEqual({ data: { user_id: 5, request_id: 2 } });
  });
});

describe("users", () => {
  it("desenvuelve data.users", async () => {
    mockFetch(200, { data: { users: [{ id: 1 }] }, metadata: { pagination: { total_records: 1, page: 1, per_page: 10 } } });
    await expect(listUsers({})).resolves.toMatchObject({ items: [{ id: 1 }] });
  });

  it("crea y cambia estado con cuerpos envueltos en data", async () => {
    let fetchMock = mockFetch(201, { data: { user: { id: 3, employee_id: "123" } } });
    await createUser({ full_name: "Laura Ruiz", email: "l@x.co", role: "LOGISTICS" });
    expect(call(fetchMock).body).toEqual({ data: { full_name: "Laura Ruiz", email: "l@x.co", role: "LOGISTICS" } });

    fetchMock = mockFetch(200);
    await setUserStatus(3, "INACTIVE");
    expect(call(fetchMock)).toEqual({ url: "/api/admin/users/3", method: "PUT", body: { data: { status: "INACTIVE" } } });
  });

  it("expone el 502 de correo como ApiError", async () => {
    mockFetch(502, { message: "Fallo SMTP" });
    const error = await createUser({ full_name: "A B", email: "a@b.co", role: "ADMIN" }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(502);
  });
});

describe("resources", () => {
  it("usa la ruta del tipo y ordena por nombre", async () => {
    const fetchMock = mockFetch(200, { data: { resources: [] } });
    await listResourcesByType("MATERIAL", { status: "inactive" });
    expect(call(fetchMock).url).toBe("/api/admin/resources/material?sort_by=name&status=inactive");
  });

  it("marca requires_confirmation en el 409 de duplicado", async () => {
    mockFetch(409, { message: "Posible duplicado", requires_confirmation: true });
    const error = await createHumanResource({ name: "Ana", operative_role_id: 1 }).catch((e) => e);
    expect(error.payload.requires_confirmation).toBe(true);
  });

  it("confirma el duplicado y cambia estado", async () => {
    let fetchMock = mockFetch(201);
    await createHumanResource({ name: "Ana", operative_role_id: 1 }, true);
    expect(call(fetchMock).body).toEqual({ data: { name: "Ana", operative_role_id: 1, confirm_duplicate: true } });

    fetchMock = mockFetch(204);
    await setResourceActive("LOGISTIC", 9, false);
    expect(call(fetchMock)).toEqual({ url: "/api/admin/resources/logistic/9", method: "PUT", body: { data: { is_active: false } } });
  });
});

describe("calendar", () => {
  it("entiende el estado de sincronización en inglés y español", () => {
    expect(isSynced("SYNCED")).toBe(true);
    expect(isSynced("Sincronizado")).toBe(true);
    expect(isSynced("Pendiente de sincronización")).toBe(false);
  });
});
