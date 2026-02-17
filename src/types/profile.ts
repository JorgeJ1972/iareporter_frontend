export interface ProfileBase {
  name: string;
  public_name: string;
  factor: number;
  factor_to_senior: number;
}

export interface ProfileCreate extends ProfileBase {
  created_user: string;
}

export interface ProfileUpdate {
  name?: string | null;
  public_name?: string | null;
  factor?: number | null;
  factor_to_senior?: number | null;
  updated_user: string;
}

export interface ProfileResponse extends ProfileBase {
  prof_id: number;
  created: Date;
  updated?: Date | null;
}