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
  logistic_user?: { id: number; full_name: string; email: string } | null;
  event_end_date?: string;
  client_email: string;
  client_phone: string;
  selected_services: string[];
  event_type: string | null;
  status: string;
}

export interface AvailableLogisticsUser {
  id: number;
  employee_id: number | string;
  full_name: string;
  role: string;
  status: string;
  availability: "Disponible" | "No disponible" | "Por verificar";
  conflict?: {
    folio: string;
    event_date: string;
    start_time: string;
    end_time: string;
  };
}