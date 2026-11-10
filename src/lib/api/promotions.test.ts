import { afterEach, describe, expect, it, vi } from "vitest";
import { createPromotion, deactivatePromotion, deletePromotion, listPromotions, updatePromotion } from "./promotions";

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

const INPUT = { name: "Temporada", description: "Aplica en temporada.", discount_percentage: 10, valid_until: "2026-12-31" };

describe("promotions api", () => {
  it("lista el catálogo de gestión con paginación", async () => {
    const fetchMock = mockFetch(200, {
      data: { promotions: [{ id: 1, ...INPUT, status: "ACTIVE" }] },
      metadata: { pagination: { total_records: 1, page: 1, per_page: 10 } },
    });
    const result = await listPromotions();
    expect(call(fetchMock).url).toBe("/api/admin/promotions");
    expect(result.items[0].discount_percentage).toBe(10);
  });

  it("crea con POST y edita con PUT (los cuatro campos obligatorios)", async () => {
    let fetchMock = mockFetch(201);
    await createPromotion(INPUT);
    expect(call(fetchMock)).toEqual({ url: "/api/admin/promotions", method: "POST", body: { data: INPUT } });

    fetchMock = mockFetch(204);
    await updatePromotion(4, INPUT);
    expect(call(fetchMock)).toEqual({ url: "/api/admin/promotions/4", method: "PUT", body: { data: INPUT } });
  });

  it("marca como no vigente con PUT y solo INACTIVE", async () => {
    const fetchMock = mockFetch(204);
    await deactivatePromotion(4);
    expect(call(fetchMock)).toEqual({ url: "/api/admin/promotions/4", method: "PUT", body: { data: { status: "INACTIVE" } } });
  });

  it("elimina con DELETE y expone el 409 de nombre duplicado", async () => {
    let fetchMock = mockFetch(204);
    await deletePromotion(4);
    expect(call(fetchMock)).toEqual({ url: "/api/admin/promotions/4", method: "DELETE", body: undefined });

    fetchMock = mockFetch(409, { message: "Ya existe una promoción vigente con ese nombre." });
    const error = await createPromotion(INPUT).catch((e) => e);
    expect(error.status).toBe(409);
    expect(error.message).toBe("Ya existe una promoción vigente con ese nombre.");
  });
});
