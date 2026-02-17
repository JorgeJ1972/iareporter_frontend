import MessageResponse from "../types/MessageResponse";
import { 
  EnvTableResponse, 
  EnvTableCreate, 
  EnvTableUpdate 
} from "../types/envTable";
import { 
  SyncTaskStartResponse, 
  SyncTaskStatusResponse,
  SyncTaskListResponse 
} from "../types/syncTask";
import apiClient from "./apiClient";

export const envTableService = {
  // Get all environment tables
  getAll: async (): Promise<MessageResponse<EnvTableResponse[]>> => {
    const response = await apiClient.get(`/env-table/`);
    return response.data;
  },

  // Get environment table by ID
  getById: async (envTableId: number): Promise<MessageResponse<EnvTableResponse>> => {
    const response = await apiClient.get(`/env-table/${envTableId}`);
    return response.data;
  },

  // Get environment tables by environment ID
  getByEnvironmentId: async (environmentId: number): Promise<MessageResponse<EnvTableResponse[]>> => {
    const response = await apiClient.get(`/env-table/environment/${environmentId}`);
    return response.data;
  },

  // Create new environment table
  create: async (envTable: EnvTableCreate): Promise<MessageResponse<EnvTableResponse>> => {
    const response = await apiClient.post("/env-table/", envTable);
    return response.data;
  },

  // Update existing environment table
  update: async (envTableId: number, envTable: EnvTableUpdate): Promise<MessageResponse<EnvTableResponse>> => {
    const response = await apiClient.put(`/env-table/${envTableId}`, envTable);
    return response.data;
  },

  // Delete environment table
  delete: async (envTableId: number): Promise<MessageResponse<void>> => {
    const response = await apiClient.delete(`/env-table/${envTableId}`);
    return response.data;
  },

  // Synchronize tables and columns from external database
  synchronize: async (environmentId: number): Promise<MessageResponse<any>> => {
    const response = await apiClient.post(`/env-table/synchronize/${environmentId}`);
    return response.data;
  },

  // Start background synchronization
  startBackgroundSync: async (environmentId: number): Promise<SyncTaskStartResponse> => {
    const response = await apiClient.post(`/env-table/sync-background/${environmentId}`);
    return response.data;
  },

  // Get sync task status
  getSyncTaskStatus: async (taskId: number): Promise<SyncTaskStatusResponse> => {
    const response = await apiClient.get(`/env-table/sync-status/${taskId}`);
    return response.data;
  },

  // Get all sync tasks for an environment
  getSyncTasksByEnvironment: async (environmentId: number): Promise<SyncTaskListResponse> => {
    const response = await apiClient.get(`/env-table/sync-tasks/${environmentId}`);
    return response.data;
  },
};
