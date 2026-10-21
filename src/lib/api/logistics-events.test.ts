import { afterEach, describe, expect, it, vi } from "vitest";
import { getLogisticsEvents, getLogisticsEvent } from "./logistics-events";
afterEach(() => vi.unstubAllGlobals());
const row = { request_id: 9, folio: "BD-2026-00009", status: "Asignada", client_name: "Persona Prueba", event_date: "2026-11-01", start_time: "18:00", end_time: "21:00", event_address: "Salon", guest_count: 40 };
function response(rows: unknown[], total = rows.length) { return Response.json({ data: { requests: rows }, metadata: { pagination: { total_records: total } } }); }
describe("logistics events contracts", () => {
  it("maps assigned requests without sending another user's identifier", async () => {
    const mock = vi.fn().mockResolvedValue(response([row])); vi.stubGlobal("fetch", mock);
    expect((await getLogisticsEvents("active"))[0]).toMatchObject({ id: 9, status: "ASSIGNED", location: "Salon", services: [] });
    expect(mock.mock.calls[0][0]).toBe("/api/logistics/requests?page=1&per_page=100");
  });
  it("returns an empty list without mock fallback", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response([])));
    expect(await getLogisticsEvents("active")).toEqual([]);
  });
  it("loads all history pages and maps finished status", async () => {
    const mock = vi.fn().mockResolvedValueOnce(response([{ ...row, status: "Finalizado" }], 2)).mockResolvedValueOnce(response([{ ...row, request_id: 10, status: "Cancelado" }], 2));
    vi.stubGlobal("fetch", mock);
    expect((await getLogisticsEvents("history")).map((e) => e.status)).toEqual(["COMPLETED", "CANCELLED"]);
    expect(mock.mock.calls[1][0]).toBe("/api/logistics/requests/history?page=2&per_page=100");
  });
  it("loads nested detail from the backend", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ data: { ...row, client: { client_name: "Persona Prueba", client_email: "test@example.com", client_phone: "9991234567" }, schedule_type: "propuesto", selected_services: [{ service_name: "Banquetes", required_resources: [] }] } })));
    expect(await getLogisticsEvent(9)).toMatchObject({ client_phone: "9991234567", schedule_status: "PROPOSED", services: [{ name: "Banquetes", resources: [] }] });
  });
  it("loads proposal context for ADMIN through the administrator detail endpoint", async () => {
    const mock = vi.fn().mockResolvedValue(Response.json({data: [{...row, status: "Propuesta generada", client_email: "client@example.com", selected_services: ["Banquetes"], event_date_time: "2026-11-02T00:00:00Z", event_end_time: "2026-11-02T03:00:00Z"}]}));
    vi.stubGlobal("fetch", mock);
    expect(await getLogisticsEvent(9, undefined, true)).toMatchObject({id: 9, status: "PROPOSAL_GENERATED", client_email: "client@example.com", event_date: "2026-11-01", start_time: "18:00"});
    expect(mock.mock.calls[0][0]).toBe("/api/admin/requests/9");
    expect(mock).toHaveBeenCalledTimes(1);
  });
  it("surfaces forbidden detail errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ message: "Sin permisos" }, { status: 403 })));
    await expect(getLogisticsEvent(9)).rejects.toMatchObject({ status: 403 });
  });
});
