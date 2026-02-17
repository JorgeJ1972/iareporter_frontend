import apiClient from "./apiClient";
import { RolCreate, RolResponse, RolUpdate } from "../types/rol";
import MessageResponse from "../types/MessageResponse";

export const rolService = {
  createRol: async (newRol: RolCreate): Promise<MessageResponse<RolResponse>> => {
    const response = await apiClient.post("/roles/", newRol);
    return response.data;
  },

  getAll: async (): Promise<MessageResponse<RolResponse[]>> => {
    const response = await apiClient.get("/roles/");
    return response.data;
  },

  getRolById: async (rolId: number): Promise<MessageResponse<RolResponse>> => {
    const response = await apiClient.get(`/roles/${rolId}`);
    return response.data;
  },

  deleteRol: async (rolId: number): Promise<MessageResponse<void>> => {
    const response = await apiClient.delete(`/roles/${rolId}`);
    return response.data;
  },

  updateRol: async (
    rolId: number,
    rolUpdate: RolUpdate
  ): Promise<MessageResponse<RolResponse>> => {
    const response = await apiClient.put(`/roles/${rolId}`, rolUpdate);
    return response.data;
  },
};