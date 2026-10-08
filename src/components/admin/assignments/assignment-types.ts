export interface AssignmentRequest {
  request_id: number;
  folio: string;
  client_name: string;
  event_date: string;
  start_time: string;
  end_time: string;
  event_address: string;
  guest_count: number;
}

export interface AssignmentRequestDetail extends AssignmentRequest {
  client_email: string;
  client_phone: string;
  selected_services: string[];
  event_type: string | null;
  status: string;
}

export interface AvailableLogisticsUser {
  id: number;
  employee_id: number;
  full_name: string;
  role: string;
  status: string;
  availability: "Disponible" | "No disponible";
  conflict?: {
    folio: string;
    event_date: string;
    start_time: string;
    end_time: string;
  };
}