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

export async function getAdminRequests(): Promise<AdminRequestsResponse> {
  return apiRequest("/api/admin/requests");
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
