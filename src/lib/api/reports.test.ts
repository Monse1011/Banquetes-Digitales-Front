import { afterEach, describe, expect, it, vi } from "vitest";
import { exportReport, getReport, listReportClients } from "./reports";

afterEach(() => vi.unstubAllGlobals());

function mockFetch(status: number, body?: unknown, headers?: Record<string, string>) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : typeof body === "string" ? body : JSON.stringify(body), { status, headers }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const call = (fetchMock: ReturnType<typeof vi.fn>) => fetchMock.mock.calls[0][0] as string;

describe("reports api", () => {
  it("lista los clientes del filtro sin paginación", async () => {
    mockFetch(200, { data: { clients: [{ email: "ana@x.co", name: "Ana López" }] } });
    await expect(listReportClients()).resolves.toEqual([{ email: "ana@x.co", name: "Ana López" }]);
  });

  it("envía los filtros aplicables como query params", async () => {
    const fetchMock = mockFetch(200, { data: { report: { type: "REQUESTS", title: "T", table: [], summary: { total: 0 }, chart: null } } });
    const report = await getReport({ type: "REQUESTS", period_type: "MONTH", month: "2026-10", client_email: "ana@x.co" });
    expect(call(fetchMock)).toBe("/api/admin/reports?type=REQUESTS&period_type=MONTH&month=2026-10&client_email=ana%40x.co");
    expect(report.type).toBe("REQUESTS");
  });

  it("omite los filtros vacíos y conserva los ids numéricos", async () => {
    const fetchMock = mockFetch(200, { data: { report: { type: "EVENTS", title: "T", table: [], summary: { total: 0 }, chart: null } } });
    await getReport({ type: "EVENTS", period_type: "NONE", client_email: "", service_id: 7, promotion_id: undefined });
    expect(call(fetchMock)).toBe("/api/admin/reports?type=EVENTS&period_type=NONE&service_id=7");
  });

  it("exporta con los mismos filtros y lee el nombre del Content-Disposition", async () => {
    const fetchMock = mockFetch(200, "xlsx", {
      "Content-Disposition": 'attachment; filename="reporte-solicitudes-2026-10-25.xlsx"',
    });
    const { filename } = await exportReport({ type: "REQUESTS", period_type: "NONE" });
    expect(call(fetchMock)).toBe("/api/admin/reports/export?type=REQUESTS&period_type=NONE");
    expect(filename).toBe("reporte-solicitudes-2026-10-25.xlsx");
  });

  it("expone el 400 de rango inválido", async () => {
    mockFetch(400, { message: "El rango seleccionado es inválido." });
    const error = await getReport({ type: "REQUESTS", period_type: "RANGE", from: "2026-10-10", to: "2026-10-01" }).catch((e) => e);
    expect(error.status).toBe(400);
    expect(error.message).toBe("El rango seleccionado es inválido.");
  });
});
