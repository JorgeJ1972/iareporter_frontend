import MessageResponse from "../types/MessageResponse";
import { 
  EnvTableColumnResponse, 
  EnvTableColumnCreate, 
  EnvTableColumnUpdate 
} from "../types/envTableColumn";
import apiClient from "./apiClient";

export const envTableColumnService = {
  // Get all environment table columns
  getAll: async (): Promise<MessageResponse<EnvTableColumnResponse[]>> => {
    const response = await apiClient.get(`/envtable-column/`);
    return response.data;
  },

  // Get environment table column by ID
  getById: async (envTableColumnId: number): Promise<MessageResponse<EnvTableColumnResponse>> => {
    const response = await apiClient.get(`/envtable-column/${envTableColumnId}`);
    return response.data;
  },

  // Get environment table columns by environment table ID
  getByEnvTableId: async (envTableId: number): Promise<MessageResponse<EnvTableColumnResponse[]>> => {
    const response = await apiClient.get(`/envtable-column/envtable/${envTableId}`);
    return response.data;
  },

  // Create new environment table column
  create: async (envTableColumn: EnvTableColumnCreate): Promise<MessageResponse<EnvTableColumnResponse>> => {
    const response = await apiClient.post("/envtable-column/", envTableColumn);
    return response.data;
  },

  // Update existing environment table column
  update: async (envTableColumnId: number, envTableColumn: EnvTableColumnUpdate): Promise<MessageResponse<EnvTableColumnResponse>> => {
    const response = await apiClient.put(`/envtable-column/${envTableColumnId}`, envTableColumn);
    return response.data;
  },

  // Delete environment table column
  delete: async (envTableColumnId: number): Promise<MessageResponse<void>> => {
    const response = await apiClient.delete(`/envtable-column/${envTableColumnId}`);
    return response.data;
  },
};
