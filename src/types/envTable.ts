import { EnvTableColumnResponse } from "./envTableColumn";

export interface EnvTableBase {
  environment_id: number;
  name: string;
  description?: string | null;
  rows_count?: number | null;
  count_last_update?: string | null; // ISO date string
  table_type?: string | null;
}

export interface EnvTableCreate {
  environment_id: number;
  name: string;
  description?: string | null;
  rows_count?: number | null;
  count_last_update?: string | null; // ISO date string
  table_type?: string | null;
}

export interface EnvTableUpdate {
  environment_id?: number | null;
  name?: string | null;
  description?: string | null;
  rows_count?: number | null;
  count_last_update?: string | null; // ISO date string
  table_type?: string | null;
}

export interface EnvTableResponse extends EnvTableBase {
  id: number;
  columns?: EnvTableColumnResponse[] | null;
}

export interface EnvTableBasic {
  id: number;
  name: string;
  environment_id: number;
}

export interface EnvTableFormState {
  id: number;
  environment_id: number;
  name: string;
  description: string;
  rows_count: number | null;
  count_last_update: string | null;
  table_type: string | null;
}

export interface EnvTableDialogState {
  visible: boolean;
  type: string;
  envTable: EnvTableResponse | null;
}
