export interface AdminRequest {
  folio: string;
  client_name: string;
  client_email: string;
  requested_date: string;
  selected_services: string[];
  status: string;
}

export interface AdminRequestsResponse {
  data: AdminRequest[];
  pagination: {
    total_records: number;
    page: number;
    per_page: number;
  };
}

async function parseErrorResponse(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  try {
    const data = await response.json();

    if (data?.error) {
      return data.error;
    }

    if (data?.message) {
      return data.message;
    }
  } catch {
    // La respuesta no contiene JSON.
  }

  return fallbackMessage;
}

export async function getAdminRequests(
  token: string,
): Promise<AdminRequestsResponse> {
  const response = await fetch("/api/admin/requests", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const message = await parseErrorResponse(
      response,
      "No fue posible obtener las solicitudes.",
    );

    const error = new Error(message);
    (error as Error & { status?: number }).status = response.status;

    throw error;
  }

  return response.json();
}