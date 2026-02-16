export interface TGroupEnvTColumnBase {
  tables_group_id: number;
  envtablecol_id: number;
  private_data?: boolean | null;
}

export interface TGroupEnvTColumnCreate {
  tables_group_id: number;
  envtablecol_id: number;
  private_data?: boolean | null;
}

export interface TGroupEnvTColumnUpdate {
  tables_group_id?: number | null;
  envtablecol_id?: number | null;
  private_data?: boolean | null;
}

export interface TGroupEnvTColumnResponse extends TGroupEnvTColumnBase {
  id: number;
}

export interface TGroupEnvTColumnBasic {
  id: number;
  tables_group_id: number;
  envtablecol_id: number;
}

export interface TGroupEnvTColumnFormState {
  id: number;
  tables_group_id: number;
  envtablecol_id: number;
  private_data: boolean | null;
}

export interface TGroupEnvTColumnDialogState {
  visible: boolean;
  type: string;
  tgroupEnvTColumn: TGroupEnvTColumnResponse | null;
}
