import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assignEventResource,
  changeResourceStatus,
  confirmEventResources,
  listResources,
  saveResource,
} from "./resources";
afterEach(() => vi.unstubAllGlobals());
describe("resource API contracts", () => {
  it("collects paginated inactive catalog without mocks", async () => {
    const response = (id: number) =>
      Response.json({
        data: { resources: [{ id, name: "Silla", type: "MATERIAL" }] },
        metadata: { pagination: { total_records: 2 } },
      });
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response(1))
      .mockResolvedValueOnce(response(2));
    vi.stubGlobal("fetch", fetch);
    expect(
      (await listResources("MATERIAL", "inactive")).resources.map((r) => r.id),
    ).toEqual([1, 2]);
    expect(fetch.mock.calls[1][0]).toContain("status=inactive&page=2");
  });
  it("sends wrapped catalog body and accepts empty 201", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", fetch);
    await saveResource("HUMAN", { name: "Persona", operative_role_id: 2 });
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      data: { name: "Persona", operative_role_id: 2 },
    });
  });
  it("queries availability for the event and saves requested quantities", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          data: { resources: [] },
          metadata: {
            pagination: { total_records: 0 },
            request: { folio: "BD-1" },
          },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    expect((await listResources("HUMAN", "active", 9)).resources).toEqual([]);
    expect(fetch.mock.calls[0][0]).toContain("/api/logistics/resources/human?");
    expect(fetch.mock.calls[0][0]).toContain("request_id=9");
    await assignEventResource(9, 4, 3, "Faltan sillas");
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({
      data: [{ resource_id: 4, quantity: 3, observation: "Faltan sillas" }],
    });
  });
  it("propagates conflicts instead of pretending confirmation succeeded", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ message: "Disponibilidad cambió" }, { status: 409 }),
        ),
    );
    await expect(confirmEventResources(9, "")).rejects.toMatchObject({
      status: 409,
    });
  });
  it("uses PUT for activation", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    await changeResourceStatus({
      id: 1,
      name: "Mesa",
      type: "MATERIAL",
      is_active: true,
    });
    expect(fetch.mock.calls[0][1].method).toBe("PUT");
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      data: { is_active: false },
    });
  });
});
