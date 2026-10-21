import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getInventory,
  listInventory,
  saveInventory,
  setInventoryActive,
  validInventory,
  type InventoryKind,
} from "./inventory-resources";
afterEach(() => vi.unstubAllGlobals());
describe.each<InventoryKind>(["material", "logistic"])("%s API", (kind) => {
  it("creates, edits and deactivates using empty 201/204 responses", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 201 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetcher);
    const values = { name: " Silla ", quantity: 0, unit_cost: 0 };
    await saveInventory(kind, values);
    await saveInventory(kind, values, 8);
    await setInventoryActive(kind, 8, false);
    expect(fetcher.mock.calls[0][0]).toBe(`/api/admin/resources/${kind}`);
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({
      data: { name: "Silla", quantity: 0, unit_cost: 0 },
    });
    expect(fetcher.mock.calls[0][1].credentials).toBe("same-origin");
    expect(fetcher.mock.calls[1][1].method).toBe("PATCH");
    expect(fetcher.mock.calls[2][1].method).toBe("PUT");
    expect(JSON.parse(fetcher.mock.calls[2][1].body)).toEqual({
      data: { is_active: false },
    });
  });
  it("paginates the nested catalog and preserves real stock", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          data: { resources: [{ id: 1, quantity: 0 }] },
          metadata: { pagination: { total_records: 2 } },
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          data: { resources: [{ id: 2, quantity: 5 }] },
          metadata: { pagination: { total_records: 2 } },
        }),
      );
    vi.stubGlobal("fetch", fetcher);
    expect(await listInventory(kind, "inactive")).toEqual([
      { id: 1, quantity: 0 },
      { id: 2, quantity: 5 },
    ]);
    expect(fetcher.mock.calls[1][0]).toContain("status=inactive&page=2");
  });
  it("reads details separately", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({
            data: { resource: { id: 8, created_at: "2026-10-14T10:00:00Z" } },
          }),
        ),
    );
    expect((await getInventory(kind, 8)).created_at).toBe(
      "2026-10-14T10:00:00Z",
    );
  });
  it("surfaces duplicate rejection without retrying or bypassing it", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        Response.json(
          { message: "Ya existe un recurso con ese nombre." },
          { status: 422 },
        ),
      );
    vi.stubGlobal("fetch", fetcher);
    await expect(
      saveInventory(kind, { name: "Silla", quantity: 1, unit_cost: 10 }),
    ).rejects.toThrow("Ya existe");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("retains backend validation messages", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { errors: { quantity: "Cantidad inválida" } },
            { status: 422 },
          ),
        ),
    );
    await expect(
      saveInventory(kind, { name: "Silla", quantity: -1, unit_cost: 0 }, 8),
    ).rejects.toThrow("Cantidad inválida");
  });
});
describe("inventory validation", () => {
  it("accepts zero stock and cost", () =>
    expect(validInventory({ name: "Mesa", quantity: 0, unit_cost: 0 })).toBe(
      true,
    ));
  it.each([
    { name: " ", quantity: 1, unit_cost: 0 },
    { name: "x".repeat(101), quantity: 1, unit_cost: 0 },
    { name: "Mesa", quantity: 1.5, unit_cost: 0 },
    { name: "Mesa", quantity: -1, unit_cost: 0 },
    { name: "Mesa", quantity: 1, unit_cost: 0.001 },
    { name: "Mesa", quantity: 1, unit_cost: NaN },
  ])("rejects invalid input %o", (values) =>
    expect(validInventory(values)).toBe(false),
  );
});
