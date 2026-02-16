export interface TGroupEnvTableBase {
  tables_group_id: number;
  envtable_id: number;
  rls?: string | null;
}

export interface TGroupEnvTableCreate {
  tables_group_id: number;
  envtable_id: number;
  rls?: string | null;
}

export interface TGroupEnvTableUpdate {
  tables_group_id?: number | null;
  envtable_id?: number | null;
  rls?: string | null;
}

export interface TGroupEnvTableResponse extends TGroupEnvTableBase {
  id: number;
}

export interface TGroupEnvTableBasic {
  id: number;
  tables_group_id: number;
  envtable_id: number;
}

export interface TGroupEnvTableFormState {
  id: number;
  tables_group_id: number;
  envtable_id: number;
  rls: string | null;
}

export interface TGroupEnvTableDialogState {
  visible: boolean;
  type: string;
  tgroupEnvTable: TGroupEnvTableResponse | null;
}
