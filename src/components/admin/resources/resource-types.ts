export type ResourceTab =
  | "all"
  | "human"
  | "material"
  | "logistic";


export interface UnifiedResource {
  id: number;
  identifier: string;
  name: string;
  type: "HUMAN" | "MATERIAL" | "LOGISTIC";
  is_active: boolean;

  operative_role_name?: string;

  quantity?: number;
  unit_cost?: number;

  created_at?: string;
  updated_at?: string;
}

export interface OperativeRoleOption {
  id: number;
  name: string;
}

export interface HumanResource {
  id: number;
  identifier: string;
  name: string;
  operative_role: OperativeRoleOption;
  is_active: boolean;
  assigned_to_event: boolean;
}

export interface HumanResourceFormValues {
  name: string;
  operative_role_id: number | null;
}

export interface InventoryResource {
  id: number;
  name: string;
  quantity: number;
  unit_cost: number;
  operative_role_id: number;
  is_active: boolean;
}

export interface LogisticResource extends InventoryResource {
  type: "LOGISTIC";
}

export interface LogisticResourceFormValues {
  name: string;
  quantity: number;
  unit_cost: number;
  operative_role_id: number | null;
}


export interface MaterialResource {
  id: number;
  name: string;
  type: "MATERIAL";
  quantity: number;
  unit_cost: number;
  operative_role_id: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  deactivated_at?: string | null;
}

export interface MaterialResourceFormValues {
  name: string;
  quantity: number;
  unit_cost: number;
  operative_role_id: number | null;
}