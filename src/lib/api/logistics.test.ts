import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assignProvisional,
  confirmResources,
  downloadProposal,
  editEvent,
  generateProposal,
  listAssignedRequests,
  listAvailability,
  releaseProvisional,
  saveAgreements,
} from "./logistics";

afterEach(() => vi.unstubAllGlobals());

function mockFetch(status: number, body?: unknown, headers?: Record<string, string>) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : typeof body === "string" ? body : JSON.stringify(body), { status, headers }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const call = (fetchMock: ReturnType<typeof vi.fn>) => ({
  url: fetchMock.mock.calls[0][0] as string,
  method: fetchMock.mock.calls[0][1].method as string | undefined,
  body: fetchMock.mock.calls[0][1].body ? JSON.parse(fetchMock.mock.calls[0][1].body) : undefined,
});

describe("logistics api", () => {
  it("conserva el mensaje de lista vacía", async () => {
    mockFetch(200, { message: "No tiene solicitudes de eventos asignadas.", data: { requests: [] } });
    const result = await listAssignedRequests({});
    expect(result.items).toEqual([]);
    expect(result.message).toBe("No tiene solicitudes de eventos asignadas.");
  });

  it("pide disponibilidad por tipo con request_id y expone metadata.request", async () => {
    const fetchMock = mockFetch(200, {
      data: { resources: [{ id: 2 }] },
      metadata: { pagination: { total_records: 1, page: 1, per_page: 25 }, request: { request_id: 5, event_date: "2026-12-09" } },
    });
    const result = await listAvailability("MATERIAL", 5, { per_page: 25 });
    expect(call(fetchMock).url).toBe("/api/logistics/resources/material?request_id=5&per_page=25");
    expect(result.request?.request_id).toBe(5);
  });

  it("asigna, libera y confirma con los cuerpos del contrato", async () => {
    let fetchMock = mockFetch(204);
    const item = { resource_id: 2, quantity: 40, usage_start: "2026-12-24 18:00:00", usage_end: "2026-12-24 23:00:00", observation: null };
    await assignProvisional(1, [item]);
    expect(call(fetchMock).body).toEqual({ data: [item], observations: null });

    fetchMock = mockFetch(204);
    await releaseProvisional(1, 2);
    expect(call(fetchMock)).toMatchObject({ url: "/api/logistics/requests/1/resources/2", method: "DELETE" });

    fetchMock = mockFetch(200, { data: { current_status: "Coordinación Lista" } });
    await expect(confirmResources(1, "ok")).resolves.toMatchObject({ current_status: "Coordinación Lista" });
    expect(call(fetchMock).body).toEqual({ observations: "ok" });
  });

  it("guarda acuerdos con la revisión vigente y genera la propuesta", async () => {
    let fetchMock = mockFetch(201, { data: { derived_information_id: 6 } });
    await expect(
      saveAgreements(1, {
        location: "Hacienda",
        start_datetime: "2026-12-24 18:30:00",
        end_datetime: "2026-12-24 23:30:00",
        observations: null,
        adjusted_resources: [{ resource_id: 2, quantity: 50 }],
        derived_information_id: 5,
      }),
    ).resolves.toBe(6);
    expect(call(fetchMock).body.data.derived_information_id).toBe(5);

    fetchMock = mockFetch(201, { data: { proposals_code: "PROP-2026-001" } });
    await generateProposal(1, { derived_information_id: 6, client_observations: null, discount_amount: 200 });
    expect(call(fetchMock).body).toEqual({ data: { derived_information_id: 6, client_observations: null, discount_amount: 200 } });
  });

  it("descarga el PDF con el nombre del Content-Disposition", async () => {
    mockFetch(200, "%PDF-1.4", { "Content-Disposition": 'attachment; filename="PROP-2026-001.pdf"' });
    const { filename } = await downloadProposal(1);
    expect(filename).toBe("PROP-2026-001.pdf");
  });

  it("edita el evento sin tocar responsable ni recursos", async () => {
    const fetchMock = mockFetch(200);
    await editEvent(10, { location: "Nueva", start_datetime: "2026-12-24 19:00:00", end_datetime: "2026-12-25 00:00:00" });
    expect(call(fetchMock)).toEqual({
      url: "/api/logistics/calendar/10",
      method: "PATCH",
      body: { data: { location: "Nueva", start_datetime: "2026-12-24 19:00:00", end_datetime: "2026-12-25 00:00:00" } },
    });
  });
});
