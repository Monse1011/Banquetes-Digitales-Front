import { apiRequest } from "./http";
export interface ClientService {
  id: number;
  nombre: string;
}

export interface ClientServicesResponse {
  data: ClientService[];
}

export interface CreateReservationRequest {
  client_full_name: string;
  email: string;
  phone: string;
  event_date_time: string;
  event_end_time: string;
  guest_count: number;
  event_address: string;
  services_ids: number[];
}

export interface CreateReservationResponse {
  data: {
    folio: string;
  }[];
}

export async function getClientServices(): Promise<ClientService[]> {
  const result = await apiRequest<ClientServicesResponse>(
    "/api/client/services",
    { auth: false },
  );
  return result.data.map((service) => ({ ...service, id: Number(service.id) }));
}
export async function createReservationRequest(
  request: CreateReservationRequest,
): Promise<CreateReservationResponse> {
  return apiRequest("/api/client/request", {
    method: "POST",
    body: request,
    auth: false,
  });
}
