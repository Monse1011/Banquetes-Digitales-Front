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
  guest_count: number;
  event_address: string;
  services_ids: number[];
}

export interface CreateReservationResponse {
  data: {
    folio: string;
  };
}

async function parseErrorResponse(response: Response, fallbackMessage: string) {
  try {
    const data = await response.json();

    if (data?.message) {
      return data.message;
    }

    if (data?.error) {
      return data.error;
    }

    return fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export async function getClientServices(): Promise<ClientService[]> {
  const response = await fetch("/api/client/services");

  if (!response.ok) {
    throw new Error(
      await parseErrorResponse(
        response,
        "No fue posible obtener los servicios",
      ),
    );
  }

  const data: ClientServicesResponse = await response.json();

  return data.data;
}

export async function createReservationRequest(
  request: CreateReservationRequest,
): Promise<CreateReservationResponse> {
  const response = await fetch("/api/client/request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorResponse(
        response,
        "No fue posible enviar la solicitud",
      ),
    );
  }

  return response.json();
}