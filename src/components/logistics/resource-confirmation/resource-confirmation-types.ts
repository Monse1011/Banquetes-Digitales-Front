export type ConfirmationResourceType =
  | "HUMAN"
  | "MATERIAL"
  | "LOGISTIC";

export type SufficiencyStatus =
  | "SUFFICIENT"
  | "INSUFFICIENT";

export interface ConfirmationResource {
  id: number;
  name: string;
  type: ConfirmationResourceType;

  requested_quantity: number;
  available_quantity: number;

  sufficiency: SufficiencyStatus;

  assigned_quantity: number;
  is_assigned: boolean;

  observation: string;

  operative_role?: string;
}

export interface ResourceConfirmationEvent {
  id: number;
  folio: string;

  client_name: string;

  event_date: string;
  start_time: string;
  end_time: string;

  schedule_status: "PROPOSED" | "CONFIRMED";

  guest_count: number;

  services: string[];

  status:
  | "ASSIGNED"
  | "COORDINATION_INCOMPLETE"
  | "COORDINATION_READY";

  human_resources: ConfirmationResource[];
  material_resources: ConfirmationResource[];
  logistic_resources: ConfirmationResource[];
}