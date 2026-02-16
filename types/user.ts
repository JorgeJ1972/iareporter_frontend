import { TablesGroupBasic } from "./tableGroupt";

export interface UserMenu {
  menu_id: number;
  name: string;
  route: string;
  icon: string;
  group: string;
  order: number;
}

export interface UserBase {
  full_name: string;
  username: string;
  role_id: number;
  is_enabled: boolean;
}



export interface UserResponse extends UserBase {
  id: number;
  role_name?: string|null;
  //created: Date; 
  updated_at?: Date | null; 
  tables_groups: TablesGroupBasic[];
}

export interface UserFilter {
  name?: string | null;
  email?: string | null;
  role_description?: string | null;
}

export interface UserPagination {
  id: number;
  name: string;
  email: string;
  rol_name: string;
}

export interface User extends UserBase {
  password: string;
  created_by: string |null;
  created_at: Date | null; 
  updated_at?: Date | null; 
  updated_by?: string | null;
}

export interface UserCreate extends UserBase {
  password: string;
}

export interface UserUpdate extends UserBase{
  id?: number | null;
  password?: string;
}


// Se define un tipo para el estado del formulario para manejar el 'id'
export interface UserFormState {
  id: number;
  role_id: number;
  username: string;
  full_name: string;
  password: string;
  is_enabled: boolean;
}


// Definir un tipo para el estado del diálogo mejora la legibilidad y el mantenimiento.
export interface DialogState {
  visible: boolean;
  type: string; // 
  user: UserResponse | null;
}

export interface UserTablesGroupsAssignment {
  user_id: number;
  tables_group_ids: number[];
}