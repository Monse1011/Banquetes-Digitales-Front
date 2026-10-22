import { apiRequest } from "./http";
export interface AdminRequest {
  request_id: number;
  folio: string;
  client_name: string;
  client_email: string;
  requested_date: string;
  selected_services: string[];
  status: string;
}

export interface AdminRequestsResponse {
  data: AdminRequest[];
  metadata: {
    pagination: {
      total_records: number;
      page: number;
      per_page: number;
    };
  };
}

export async function getAdminRequests({
  page = 1,
  perPage = 10,
  signal,
}: {
  page?: number;
  perPage?: number;
  signal?: AbortSignal;
} = {}): Promise<AdminRequestsResponse> {
  const query = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  return apiRequest(`/api/admin/requests?${query}`, { signal });
}
export async function approveAdminRequest(
  requestId: number,
): Promise<AdminRequest> {
  const result = await apiRequest<{ data: AdminRequest[] }>(
    `/api/admin/requests/${requestId}`,
    { method: "PATCH", body: { status: "Aprobada" } },
  );
  return result.data[0];
}
