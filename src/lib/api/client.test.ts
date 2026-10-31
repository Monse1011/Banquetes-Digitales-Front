import { afterEach, describe, expect, it, vi } from "vitest";
import { acceptProposal, createReservation, getTracking, proposalPdfUrl, rejectProposal, requestAdjustments } from "./client";

afterEach(() => vi.unstubAllGlobals());

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const bodyOf = (fetchMock: ReturnType<typeof vi.fn>) => JSON.parse(fetchMock.mock.calls[0][1].body);

describe("client api", () => {
  it("extrae el folio del arreglo data", async () => {
    mockFetch(201, { data: [{ folio: "BD-2026-00001" }] });
    await expect(
      createReservation({
        client_full_name: "A B",
        email: "a@b.co",
        phone: "9991234567",
        event_date_time: "x",
        event_end_time: "y",
        guest_count: 1,
        event_address: "z",
        services_ids: [1],
      }),
    ).resolves.toBe("BD-2026-00001");
  });

  it("propaga el mensaje anidado del 400 de folio inexistente", async () => {
    mockFetch(400, { error: { message: "No se encontró ninguna solicitud" } });
    await expect(getTracking("BD-2026-99999")).rejects.toThrow("No se encontró ninguna solicitud");
  });

  it("envía los cuerpos envueltos en data", async () => {
    let fetchMock = mockFetch(200, { data: {} });
    await acceptProposal("BD-2026-00001");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/client/requests/BD-2026-00001/proposal/accept");
    expect(bodyOf(fetchMock)).toEqual({ data: { accepted_terms: true } });

    fetchMock = mockFetch(200, { data: {} });
    await requestAdjustments("BD-2026-00001", "Más meseros");
    expect(bodyOf(fetchMock)).toEqual({ data: { observations: "Más meseros" } });

    fetchMock = mockFetch(200, { data: {} });
    await rejectProposal("BD-2026-00001");
    expect(bodyOf(fetchMock)).toEqual({ data: { confirm_rejection: true } });
  });

  it("arma la URL del PDF inline o de descarga", () => {
    expect(proposalPdfUrl("BD-2026-00001")).toBe("/api/client/requests/BD-2026-00001/proposal/pdf");
    expect(proposalPdfUrl("BD-2026-00001", true)).toBe("/api/client/requests/BD-2026-00001/proposal/pdf?download=true");
  });
});
