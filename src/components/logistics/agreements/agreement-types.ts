export type AgreementResourceType =
  | "HUMAN"
  | "MATERIAL"
  | "LOGISTIC";

export interface AgreementResource {
  resource_id: number;
  name: string;
  type: AgreementResourceType;
  requested_quantity: number;
  assigned_quantity: number;
  adjusted_quantity: number;
  available_quantity: number;
}

export interface AgreementEventData {
  id: number;
  folio: string;

  client_name: string;
  client_email: string;
  client_phone: string;

  location: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;

  confirmation_observations: string | null;

  human_resources: AgreementResource[];
  material_resources: AgreementResource[];
  logistic_resources: AgreementResource[];
}

export interface AgreementFormValues {
  location: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  observations: string;

  human_resources: AgreementResource[];
  material_resources: AgreementResource[];
  logistic_resources: AgreementResource[];
}

export interface GeneratedProposal {
  proposal_id: number;
  proposals_code: string;
  name: string;
  creation_date: string;
  status: "in_review";
  request_status: "Propuesta generada";
  pdf_url: string;
}