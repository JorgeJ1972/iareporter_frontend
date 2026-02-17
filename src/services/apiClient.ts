import axios from "axios";
import { HandlerStorage } from "../utils/HandlerStorage";
import NamesStorage from "../types/constants/NamesStorage";

const storage = new HandlerStorage<string>();

const getAuthToken = (): string | null => {
  return storage.find(NamesStorage.TOKEN, "");
};

const apiClient = axios.create({
  //baseURL: "http://localhost:8000",
  baseURL: "https://api-fastapi-e7e5bmeah4euchhp.eastus-01.azurewebsites.net",
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
   // debugger;
    if (!error.response) {
      console.error("Error de red. Verifica tu conexión.");
      return Promise.reject(error);
    }
    const { status } = error.response;
    if (status === 401) {
      console.warn("Token inválido o expirado. Redirigiendo al login...");

      //window.location.href = "/login";
      window.dispatchEvent(new CustomEvent('sessionExpired'));
    } else if (status === 403) {
      console.warn("Acceso denegado. No tienes permisos.");
    } else if (status === 500) {
      console.error("Error interno del servidor.");
    }
    return Promise.reject(error);
  }
);

export default apiClient;
