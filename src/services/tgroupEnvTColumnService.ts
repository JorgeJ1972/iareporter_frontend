import MessageResponse from "../types/MessageResponse";
import { 
  TGroupEnvTColumnResponse, 
  TGroupEnvTColumnCreate, 
  TGroupEnvTColumnUpdate 
} from "../types/tgroupEnvTColumn";
import apiClient from "./apiClient";

export const tgroupEnvTColumnService = {
  // Get all tables group environment table columns
  getAll: async (): Promise<MessageResponse<TGroupEnvTColumnResponse[]>> => {
    const response = await apiClient.get(`/tgroup-envtcolumn/`);
    return response.data;
  },

  // Get tables group environment table column by ID
  getById: async (tgroupEnvTColumnId: number): Promise<MessageResponse<TGroupEnvTColumnResponse>> => {
    const response = await apiClient.get(`/tgroup-envtcolumn/${tgroupEnvTColumnId}`);
    return response.data;
  },

  // Get tables group environment table columns by tables group ID
  getByTablesGroupId: async (tablesGroupId: number): Promise<MessageResponse<TGroupEnvTColumnResponse[]>> => {
    const response = await apiClient.get(`/tgroup-envtcolumn/tables-group/${tablesGroupId}`);
    return response.data;
  },

  // Get tables group environment table columns by environment table column ID
  getByEnvTableColumnId: async (envTableColumnId: number): Promise<MessageResponse<TGroupEnvTColumnResponse[]>> => {
    const response = await apiClient.get(`/tgroup-envtcolumn/envtable-column/${envTableColumnId}`);
    return response.data;
  },

  // Create new tables group environment table column
  create: async (tgroupEnvTColumn: TGroupEnvTColumnCreate): Promise<MessageResponse<TGroupEnvTColumnResponse>> => {
    const response = await apiClient.post("/tgroup-envtcolumn/", tgroupEnvTColumn);
    return response.data;
  },

  // Update existing tables group environment table column
  update: async (tgroupEnvTColumnId: number, tgroupEnvTColumn: TGroupEnvTColumnUpdate): Promise<MessageResponse<TGroupEnvTColumnResponse>> => {
    const response = await apiClient.put(`/tgroup-envtcolumn/${tgroupEnvTColumnId}`, tgroupEnvTColumn);
    return response.data;
  },

  // Delete tables group environment table column
  delete: async (tgroupEnvTColumnId: number): Promise<MessageResponse<void>> => {
    const response = await apiClient.delete(`/tgroup-envtcolumn/${tgroupEnvTColumnId}`);
    return response.data;
  },
};
