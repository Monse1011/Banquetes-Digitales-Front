import { afterEach, describe, expect, it, vi } from "vitest";
import { createService, deleteService, listServices, setServiceStatus, updateService } from "./services";

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

describe("services api", () => {
  it("lista con paginación y orden del catálogo de gestión", async () => {
    const fetchMock = mockFetch(200, {
      data: { services: [{ id: 1, name: "Banquetes", description: "Menú", price: 1500, status: "ACTIVE" }] },
      metadata: { pagination: { total_records: 12, page: 2, per_page: 10 } },
    });
    const result = await listServices({ page: 2, per_page: 10 });
    expect(call(fetchMock).url).toBe("/api/admin/services?page=2&per_page=10");
    expect(result.pagination.total_records).toBe(12);
    expect(result.items[0].name).toBe("Banquetes");
  });

  it("crea y edita con el cuerpo envuelto en data", async () => {
    let fetchMock = mockFetch(201);
    await createService({ name: "Nuevo", description: "Algo", price: 250 });
    expect(call(fetchMock)).toEqual({
      url: "/api/admin/services",
      method: "POST",
      body: { data: { name: "Nuevo", description: "Algo", price: 250 } },
    });

    fetchMock = mockFetch(204);
    await updateService(9, { name: "Editado", description: "Algo más", price: 300.5 });
    expect(call(fetchMock)).toEqual({
      url: "/api/admin/services/9",
      method: "PATCH",
      body: { data: { name: "Editado", description: "Algo más", price: 300.5 } },
    });
  });

  it("cambia vigencia con PUT y elimina con DELETE", async () => {
    let fetchMock = mockFetch(204);
    await setServiceStatus(3, "INACTIVE");
    expect(call(fetchMock)).toEqual({ url: "/api/admin/services/3", method: "PUT", body: { data: { status: "INACTIVE" } } });

    fetchMock = mockFetch(204);
    await setServiceStatus(3, "ACTIVE");
    expect(call(fetchMock).body).toEqual({ data: { status: "ACTIVE" } });

    fetchMock = mockFetch(204);
    await deleteService(3);
    expect(call(fetchMock)).toEqual({ url: "/api/admin/services/3", method: "DELETE", body: undefined });
  });

  it("expone el 409 de nombre duplicado con su mensaje", async () => {
    mockFetch(409, { message: "Ya existe un servicio vigente con ese nombre." });
    const error = await createService({ name: "Repetido", description: "x", price: 1 }).catch((e) => e);
    expect(error.status).toBe(409);
    expect(error.message).toBe("Ya existe un servicio vigente con ese nombre.");
  });
});
