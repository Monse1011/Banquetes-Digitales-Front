import { afterEach, expect, it, vi } from "vitest";
import { listApprovedRequests, listLogisticsUsers, saveAssignment, getAssignmentDetail } from "./assignments";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
afterEach(() => vi.restoreAllMocks());
it("acepta el OK de texto y manda el identificador elegido con cookie", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("OK"));
  await expect(saveAssignment(2, 7)).resolves.toBeUndefined();
  expect(fetchMock).toHaveBeenCalledWith("/api/admin/requests/2/assignment", expect.objectContaining({
    method: "PATCH", credentials: "same-origin", body: JSON.stringify({ data: { user_id: 7 } }),
  }));
});
it("conserva los datos de conflicto del rechazo", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(json({ message: "No disponible", conflict: { folio: "BD-1", event_date: "2026-10-14", start_time: "10:00", end_time: "15:00" } }, 409));
  await expect(saveAssignment(2, 7)).rejects.toThrow("BD-1, 2026-10-14, 10:00–15:00");
});
it("no inventa disponibilidad para los empleados activos", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(json({ data: { users: [{ id: 7, employee_id: "EMP-7", full_name: "Logística" }] } }));
  expect((await listLogisticsUsers())[0].availability).toBe("Por verificar");
});
it("recupera todas las páginas de aprobadas", async () => {
  const row = { request_id: 1, folio: "BD-1", event_date: "2026-10-14", start_time: "10:00" };
  const fetchMock = vi.spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(json({ data: [row], metadata: { pagination: { total_records: 2 } } }))
    .mockResolvedValueOnce(json({ data: [{ ...row, request_id: 2 }], metadata: { pagination: { total_records: 2 } } }));
  expect(await listApprovedRequests()).toHaveLength(2);
  expect(fetchMock.mock.calls[1][0]).toContain("page=2");
});
it("rechaza un detalle que ya no está aprobado", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(json({ data: [{ status: "Asignada" }] }));
  await expect(getAssignmentDetail({ request_id: 1, folio: "BD-1", client_name: "Cliente", event_date: "2026-10-14", start_time: "10:00", end_time: "15:00", event_address: "Lugar", guest_count: 10 })).rejects.toThrow("ya no se encuentra en estado Aprobada");
});

it("envía el responsable anterior en la reasignación para detectar concurrencia", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("OK"));
  await saveAssignment(2, 8, 7);
  expect(fetchMock).toHaveBeenCalledWith("/api/admin/requests/2/assignment", expect.objectContaining({
    body: JSON.stringify({ data: { user_id: 8, request_id: 7 } }),
  }));
});

it("no trata un conflicto de responsable como reasignación exitosa", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(json({ message: "La solicitud ya fue asignada." }, 409));
  await expect(saveAssignment(2, 8, 7)).rejects.toThrow("La solicitud ya fue asignada.");
});

it("la ficha conserva responsable y fecha final de un evento nocturno", async () => {
  const { getRequestDetail } = await import("./assignments");
  vi.spyOn(globalThis, "fetch").mockResolvedValue(json({ data: [{
    request_id: 2, status: "Asignada", event_date_time: "2026-09-18T20:22:00", event_end_time: "2026-09-19T01:22:00",
    logistic_user: { id: 7, full_name: "Logística Demo", email: "demo@example.invalid" },
    client_phone: null, selected_services: ["Banquete"],
  }] }));
  const detail = await getRequestDetail(2);
  expect(detail.logistic_user?.id).toBe(7);
  expect(detail.event_end_date).toBe("2026-09-19");
  expect(detail.client_phone).toBe("Sin registrar");
});
