import Menu from "./Menu";
import { UserResponse } from "./user";

export interface TokenResponse {
    token: string;
    user: UserResponse;
    menu: Menu[];
  }

  export default TokenResponse;