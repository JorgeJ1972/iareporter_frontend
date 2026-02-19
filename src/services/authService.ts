import NamesStorage from "../types/constants/NamesStorage";
import Menu from "../types/Menu";
import TokenResponse from "../types/TokenResponse";
import { UserResponse } from "../types/user";
import { HandlerStorage } from "../utils/HandlerStorage";
import apiClient from "./apiClient";
import MessageResponse from "../types/MessageResponse";
import { jwtDecode } from 'jwt-decode'; // <-- Añadir esta importación

// 1. Se define un tipo para comunicar el estado de la autenticación de forma clara.
export type AuthStatus = {
  isAuthenticated: boolean;
  reason: 'VALID' | 'NO_TOKEN' | 'EXPIRED' | 'INVALID_TOKEN';
};

const storage = new HandlerStorage<string>();

const login = async (username: string, password: string): Promise<MessageResponse<TokenResponse>> => {
  // El servicio ahora solo hace la petición y devuelve los datos.
  // El manejo de errores y efectos secundarios se delega al componente.
  const response = await apiClient.post<MessageResponse<TokenResponse>>('/token2', { username, password });
  return response.data;
};

const logout = () => {
  Object.values(NamesStorage).forEach((key) => storage.remove(key));
};

const loginWithAzureSSO = async (idToken: string): Promise<MessageResponse<TokenResponse>> => {
  const response = await apiClient.post<MessageResponse<TokenResponse>>('/azure-login', { id_token: idToken });
  return response.data;
};

/**
 * Verifica el estado actual de la autenticación, incluyendo la expiración del token.
 * @returns {AuthStatus} - Un objeto con el estado y la razón.
 */
const checkAuthStatus = (): AuthStatus => {
  const token = storage.find(NamesStorage.TOKEN, "")
  if (!token) {
    // Si no hay token, no está autenticado.
    return { isAuthenticated: false, reason: 'NO_TOKEN' };
  }
  try {
    // Decodificamos el token para leer su contenido.
    const decodedToken: { exp: number } = jwtDecode(token);

    // La fecha de expiración (exp) viene en segundos. La convertimos a milisegundos.
    const expirationTime = decodedToken.exp * 1000;

    if (expirationTime < Date.now()) {
      // El token ha expirado.
      console.warn("El token ha expirado. Se cerrará la sesión.");
      return { isAuthenticated: false, reason: 'EXPIRED' };
    }

    // El token es válido y no ha expirado.
    return { isAuthenticated: true, reason: 'VALID' };

  } catch (error) {
    // El token está malformado o es inválido.
    console.error("Token inválido o malformado:", error);
    return { isAuthenticated: false, reason: 'INVALID_TOKEN' };
  }
};

const getUser = (): UserResponse | null => {
  const user = new HandlerStorage<UserResponse>().find(NamesStorage.USER, { "id": 0, "full_name": "", "username": "", "role_id": 0, "is_enabled": true, "role_name": "", "updated_at": new Date() } as UserResponse);
  return user;
};

const getMenus = (): Menu[] => {
  const menus = new HandlerStorage<Menu[]>().find(NamesStorage.MENU, []);
  return menus;
};

export { login, loginWithAzureSSO, logout, checkAuthStatus, getUser, getMenus };

