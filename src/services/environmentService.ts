import MessageResponse from "../types/MessageResponse";
import { EnvironmentCreate, EnvironmentResponse, EnvironmentUpdate, DatabaseTypeResponse, EnvironmenTablesGroups } from "../types/environment";
import apiClient from "./apiClient";

export const environmentService = {
  getEnvironments: async (): Promise<MessageResponse<EnvironmentResponse[]>> => {
    const response = await apiClient.get("/environment/");
    return response.data;
  },

  getById: async (
    id: number
  ): Promise<MessageResponse<EnvironmentResponse>> => {
    const response = await apiClient.get(`/environment/${id}`);
    return response.data;
  },

  delete: async (
    id: number
  ): Promise<MessageResponse<void>> => {
    const response = await apiClient.delete(`/environment/${id}`);
    return response.data;
  },

  create: async (
    environment: EnvironmentCreate
  ): Promise<MessageResponse<EnvironmentResponse>> => {
    const response = await apiClient.post("/environment/", environment);
    return response.data;
  },

  update: async (
    id: number,
    environment: EnvironmentUpdate
  ): Promise<MessageResponse<EnvironmentResponse>> => {
    const response = await apiClient.put(`/environment/${id}`, environment);
    return response.data;
  },

  getDatabaseTypes: async (): Promise<MessageResponse<DatabaseTypeResponse[]>> => {
    const response = await apiClient.get("/database-type/");
    return response.data;
  },

  testConnection: async (
    database_type_id: number,
    connection_string: string
  ): Promise<MessageResponse<{ connected: boolean }>> => {
    //console.log("Testing connection with database_type_id:", database_type_id);
    //console.log("Testing connection with connection_string:", connection_string);
    const response = await apiClient.post("/environment/test-connection", {
      database_type_id,
      connection_string,
    });
    return response.data;
  },

  getActiveEnvironmentsWithTablesGroups: async (): Promise<MessageResponse<EnvironmenTablesGroups[]>> => {
    const response = await apiClient.get("/environment/list/active-with-tables-groups");
    return response.data;
  },
};
