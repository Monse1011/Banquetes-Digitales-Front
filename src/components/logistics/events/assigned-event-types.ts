export type LogisticsEventStatus =
  | "ASSIGNED"
  | "COORDINATION_READY"
  | "COORDINATION_INCOMPLETE"
  | "PROPOSAL_GENERATED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

export type ScheduleStatus =
  | "PROPOSED"
  | "CONFIRMED";

export type ResourceType =
  | "HUMAN"
  | "MATERIAL"
  | "LOGISTIC";

export interface RequiredResource {
  type: ResourceType;
  name: string;
  quantity: number;
}

export interface RequestedService {
  name: string;
  resources: RequiredResource[];
}

export interface AssignedEvent {
  id: number;
  folio: string;
  status: LogisticsEventStatus;

  client_name: string;
  client_email: string | null;
  client_phone: string | null;

  event_date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  guest_count: number | null;

  schedule_status: ScheduleStatus;

  services: RequestedService[];
}