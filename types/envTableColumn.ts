export interface EnvTableColumnBase {
  envtable_id: number;
  name: string;
  data_type?: string | null;
  max_length?: string | null;
  is_null?: boolean | null;
  fk_info?: string | null;
  description?: string | null;
  synonyms?: string | null;
  business_name?: string | null;
  business_values?: string | null;
  is_pk?: boolean | null;
}

export interface EnvTableColumnCreate {
  envtable_id: number;
  name: string;
  data_type?: string | null;
  max_length?: string | null;
  is_null?: boolean | null;
  fk_info?: string | null;
  description?: string | null;
  synonyms?: string | null;
  business_name?: string | null;
  business_values?: string | null;
  is_pk?: boolean | null;
}

export interface EnvTableColumnUpdate {
  envtable_id?: number | null;
  name?: string | null;
  data_type?: string | null;
  max_length?: string | null;
  is_null?: boolean | null;
  fk_info?: string | null;
  description?: string | null;
  synonyms?: string | null;
  business_name?: string | null;
  business_values?: string | null;
  is_pk?: boolean | null;
}

export interface EnvTableColumnResponse extends EnvTableColumnBase {
  id: number;
}

export interface EnvTableColumnBasic {
  id: number;
  name: string;
  envtable_id: number;
  data_type?: string | null;
}

export interface EnvTableColumnFormState {
  id: number;
  envtable_id: number;
  name: string;
  data_type: string | null;
  max_length: string | null;
  is_null: boolean | null;
  fk_info: string | null;
  description: string | null;
  synonyms: string | null;
  business_name: string | null;
  business_values: string | null;
  is_pk: boolean | null;
}

export interface EnvTableColumnDialogState {
  visible: boolean;
  type: string;
  envTableColumn: EnvTableColumnResponse | null;
}
