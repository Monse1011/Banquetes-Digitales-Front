import { afterEach, describe, expect, it, vi } from "vitest";
import {
  agreementError,
  getAgreements,
  meridaInput,
  saveAgreements,
} from "./agreements";
import { ApiError } from "./http";
afterEach(() => vi.unstubAllGlobals());
describe("agreements HTTP contract", () => {
  it("loads saved observations and the actual ending date", async () => {
    const data = {
      request_id: 3,
      observations: "Mantener",
      start_datetime: "2035-06-02T00:00:00.000Z",
      end_datetime: "2035-06-02T07:00:00.000Z",
      assigned_resources: [],
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ data })));
    expect(await getAgreements(3)).toEqual(data);
    expect(meridaInput(data.start_datetime)).toBe("2035-06-01T18:00");
    expect(meridaInput(data.end_datetime)).toBe("2035-06-02T01:00");
  });
  it("sends every assigned resource with the adjusted quantity and explicit timezone", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        Response.json({ data: { derived_information_id: 7 } }, { status: 201 }),
      );
    vi.stubGlobal("fetch", fetch);
    await saveAgreements(
      3,
      {
        location: " Salon ",
        start: "2035-06-01T18:00",
        end: "2035-06-02T01:00",
        observations: "Nota",
        quantities: { 2: 4, 5: 0 },
      },
      [
        {
          resource_id: 2,
          name: "Sillas",
          type: "MATERIAL",
          quantity: 3,
          unit_cost: 2,
        },
        {
          resource_id: 5,
          name: "Persona",
          type: "HUMAN",
          quantity: 1,
          unit_cost: null,
        },
      ],
    );
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      data: {
        location: "Salon",
        start_datetime: "2035-06-02T00:00:00.000Z",
        end_datetime: "2035-06-02T07:00:00.000Z",
        observations: "Nota",
        adjusted_resources: [
          { resource_id: 2, quantity: 4 },
          { resource_id: 5, quantity: 0 },
        ],
      },
    });
  });
  it("surfaces schedule conflicts and validation fields", () => {
    expect(
      agreementError(
        new ApiError("Conflicto", 409, {
          conflicts: [
            {
              folio: "BD-2",
              event_date: "2035-06-01",
              start_time: "18:00",
              end_time: "22:00",
            },
          ],
        }),
      ),
    ).toContain("BD-2: 2035-06-01 18:00–22:00");
    expect(
      agreementError(
        new ApiError("Validacion", 400, {
          errors: { location: "Ubicación obligatoria" },
        }),
      ),
    ).toContain("Ubicación obligatoria");
  });
  it("does not turn a failed save into success", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ message: "No permitido" }, { status: 403 }),
        ),
    );
    await expect(
      saveAgreements(
        3,
        {
          location: "Salon",
          start: "2035-06-01T18:00",
          end: "2035-06-02T01:00",
          observations: "",
          quantities: {},
        },
        [],
      ),
    ).rejects.toMatchObject({ status: 403 });
  });
});

it("formats calendar conflicts with resource names, folios and actual datetime fields", () => {
  const text = agreementError(
    new ApiError("Conflicto de calendario", 409, {
      conflicts: [
        {
          type: "responsible",
          reason: "overlap",
          folio: "BD-2026-90001",
          start_datetime: "2026-10-28 10:00:00",
          end_datetime: "2026-10-28 12:00:00",
        },
        {
          type: "resource",
          reason: "overlap",
          resource_name: "camioneta",
          resource_id: 5,
          folios: ["BD-2026-90001"],
        },
      ],
    }),
  );
  expect(text).toContain("Responsable ocupado en BD-2026-90001");
  expect(text).toContain("2026-10-28 10:00:00");
  expect(text).toContain("Recurso camioneta");
  expect(text).toContain("tres horas");
  expect(text).not.toContain("undefined");
});
