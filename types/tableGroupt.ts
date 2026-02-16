export interface TableGroup {
  id: number;
  name: string;
  description?: string | null;
}

export interface TablesGroupCat {
  id: number;
  name: string;
  description: string;
  environment_id: number;
  prompt_system: string;
  is_enabled: boolean;
}

export interface TablesGroupCatInsert {
  name: string;
  description: string;
  environment_id: number;
  prompt_system: string;
  is_enabled: boolean;
}

export interface TablesGroupFormState {
  id: number;
  name: string;
  description: string;
  environment_id: number;
  prompt_system: string;
  is_enabled: boolean;
}

export interface DialogState {
  visible: boolean;
  type: string;
  tablesGroup: TablesGroupCat | null;
}

export interface TablesGroupBasic {
  id: number;
  name: string;
  description: string;
  is_enabled : boolean;
}

export interface TablesGroupBasic {
  id: number;
  name: string;
  description: string;
  is_enabled: boolean;
}