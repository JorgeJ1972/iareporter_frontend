export interface RolBase {
    name: string;
  }
  
  export interface RolCreate extends RolBase {
    created_user: string;
  }
  
  export interface RolResponse extends RolBase {
    id: number;
  }
  
  export interface RolUpdate extends RolBase {}