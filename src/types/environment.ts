import { TablesGroupBasic } from "./tableGroupt";

export interface EnvironmentBase {
    name: string;
    description: string;
    connection_string?: string | null;
    database_type_id: number;
    is_enabled: boolean;
  }
  
  export interface EnvironmentResponse extends EnvironmentBase {
    id: number;
    database_type_name?: string | null;
    tables_groups_names?: string | null;
  }
  
  export interface EnvironmentCreate extends EnvironmentBase {
    // Same as base for now
  }
  
  export interface EnvironmentUpdate extends EnvironmentBase {
    id?: number | null;
  }
  
  export interface EnvironmentFormState {
    id: number;
    name: string;
    description: string;
    connection_string: string;
    database_type_id: number;
    is_enabled: boolean;
  }
  
  export interface DialogState {
    visible: boolean;
    type: string;
    environment: EnvironmentResponse | null;
  }
  
  export interface DatabaseTypeResponse {
    id: number;
    name: string;
    description?: string | null;
  }
 
  export interface EnvironmentTablesGroup {
    user_id:number;
    environment_id:number;
    environmenr_name:string;
    environment_description:string;
    tables_group_id:number;
    tables_group_name:string;
    tables_group_description:string;
}

export interface EnvironmenTablesGroups {
  id: number;
  name: string;
  description: string;
  database_type_id: number;
  database_type_name?: string | null;
  is_enabled: boolean;
  tables_groups: TablesGroupBasic[];
}