import type { AssignmentRequest, AssignmentRequestDetail, AvailableLogisticsUser } from "@/components/admin/assignments/assignment-types";

type ListResponse = { data: AssignmentRequest[]; metadata: { pagination: { total_records: number } } };
type DetailResponse = { data: Array<AssignmentRequestDetail & { event_date_time: string; event_end_time: string }> };

async function check(response: Response): Promise<void> {
  if (response.ok) return;
  const body = await response.json().catch(() => ({}));
  let message = body.message || "No fue posible completar la operación.";
  if (response.status === 401) message = "La sesión expiró. Inicia sesión nuevamente.";
  if (body.conflict) {
    const c = body.conflict;
    message += ` Conflicto: ${c.folio}, ${c.event_date}, ${c.start_time}–${c.end_time}.`;
  }
  throw new Error(message);
}

export async function listApprovedRequests(signal?: AbortSignal): Promise<AssignmentRequest[]> {
  const requests: AssignmentRequest[] = [];
  for (let page = 1; ; page++) {
    const response = await fetch(`/api/admin/requests?status=APPROVED&page=${page}&per_page=100`, {
      credentials: "same-origin", cache: "no-store", signal,
    });
    await check(response);
    const body: ListResponse = await response.json();
    if (!Array.isArray(body.data)) throw new Error("Respuesta de solicitudes inválida.");
    requests.push(...body.data);
    if (!body.data.length || requests.length >= body.metadata.pagination.total_records) break;
  }
  return requests.sort((a, b) => `${a.event_date} ${a.start_time} ${a.folio}`.localeCompare(`${b.event_date} ${b.start_time} ${b.folio}`));
}

export async function getAssignmentDetail(request: AssignmentRequest): Promise<AssignmentRequestDetail> {
  return getRequestDetail(request.request_id, true);
}

export async function getRequestDetail(requestId: number, requireApproved = false): Promise<AssignmentRequestDetail> {
  const response = await fetch(`/api/admin/requests/${requestId}`, { credentials: "same-origin", cache: "no-store" });
  await check(response);
  const body: DetailResponse = await response.json();
  const detail = body.data?.[0];
  if (!detail) throw new Error("No se encontró el detalle de la solicitud.");
  if (requireApproved && detail.status !== "Aprobada") throw new Error("La solicitud ya no se encuentra en estado Aprobada.");
  const start = new Date(detail.event_date_time);
  const end = new Date(detail.event_end_time);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new Error("La solicitud no tiene un horario válido.");
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    ...detail,
    event_date: `${start.getFullYear()}-${pad(start.getMonth()+1)}-${pad(start.getDate())}`,
    event_end_date: `${end.getFullYear()}-${pad(end.getMonth()+1)}-${pad(end.getDate())}`,
    start_time: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
    end_time: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
    client_phone: detail.client_phone || "Sin registrar",
    client_email: detail.client_email || "Sin registrar",
    event_type: detail.event_type ?? null,
    selected_services: detail.selected_services ?? [],
  };
}

export async function listLogisticsUsers(): Promise<AvailableLogisticsUser[]> {
  const response = await fetch("/api/admin/users/usersavailable", { credentials: "same-origin", cache: "no-store" });
  await check(response);
  const body = await response.json();
  if (!Array.isArray(body.data?.users)) throw new Error("Respuesta de empleados inválida.");
  return body.data.users.map((user: { id: number; employee_id: string; full_name: string }) => ({
    ...user, role: "Personal de Logística", status: "Activo", availability: "Por verificar",
  }));
}

export async function saveAssignment(requestId: number, userId: number, currentUserId?: number): Promise<void> {
  const response = await fetch(`/api/admin/requests/${requestId}/assignment`, {
    method: "PATCH", credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { user_id: userId, ...(currentUserId === undefined ? {} : { request_id: currentUserId }) } }),
  });
  await check(response); // El backend devuelve texto OK, no JSON.
}
