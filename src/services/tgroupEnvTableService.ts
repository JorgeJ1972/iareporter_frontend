import MessageResponse from "../types/MessageResponse";
import { 
  TGroupEnvTableResponse, 
  TGroupEnvTableCreate, 
  TGroupEnvTableUpdate 
} from "../types/tgroupEnvTable";
import apiClient from "./apiClient";

export const tgroupEnvTableService = {
  // Get all tables group environment tables
  getAll: async (): Promise<MessageResponse<TGroupEnvTableResponse[]>> => {
    const response = await apiClient.get(`/tgroup-envtable/`);
    return response.data;
  },

  // Get tables group environment table by ID
  getById: async (tgroupEnvTableId: number): Promise<MessageResponse<TGroupEnvTableResponse>> => {
    const response = await apiClient.get(`/tgroup-envtable/${tgroupEnvTableId}`);
    return response.data;
  },

  // Get tables group environment tables by tables group ID
  getByTablesGroupId: async (tablesGroupId: number): Promise<MessageResponse<TGroupEnvTableResponse[]>> => {
    const response = await apiClient.get(`/tgroup-envtable/tables-group/${tablesGroupId}`);
    return response.data;
  },

  // Get tables group environment tables by environment table ID
  getByEnvTableId: async (envTableId: number): Promise<MessageResponse<TGroupEnvTableResponse[]>> => {
    const response = await apiClient.get(`/tgroup-envtable/envtable/${envTableId}`);
    return response.data;
  },

  // Create new tables group environment table
  create: async (tgroupEnvTable: TGroupEnvTableCreate): Promise<MessageResponse<TGroupEnvTableResponse>> => {
    const response = await apiClient.post("/tgroup-envtable/", tgroupEnvTable);
    return response.data;
  },

  // Update existing tables group environment table
  update: async (tgroupEnvTableId: number, tgroupEnvTable: TGroupEnvTableUpdate): Promise<MessageResponse<TGroupEnvTableResponse>> => {
    const response = await apiClient.put(`/tgroup-envtable/${tgroupEnvTableId}`, tgroupEnvTable);
    return response.data;
  },

  // Delete tables group environment table
  delete: async (tgroupEnvTableId: number): Promise<MessageResponse<void>> => {
    const response = await apiClient.delete(`/tgroup-envtable/${tgroupEnvTableId}`);
    return response.data;
  },
};
