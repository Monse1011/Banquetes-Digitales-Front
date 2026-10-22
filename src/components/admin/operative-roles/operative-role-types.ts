export interface OperativeRole {
  id: number;
  name: string;
  is_active: boolean;
  active_human_resources_count: number;
}

export interface OperativeRoleFormValues {
  name: string;
}