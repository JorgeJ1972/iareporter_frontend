import MessageResponse from "../types/MessageResponse";
import { UserCreate, UserResponse, UserUpdate, UserTablesGroupsAssignment } from "../types/user";
import apiClient from "./apiClient";

export const userService = {

  getUsers: async (): Promise<MessageResponse<UserResponse[]>> => {
    const response = await apiClient.get("/users/");
    return response.data;
  },

  getById: async (
    id: number
  ): Promise<MessageResponse<UserResponse>> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  delete: async (
    id: number
  ): Promise<MessageResponse<void>> => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },

  create: async (
    user: UserCreate
  ): Promise<MessageResponse<UserResponse>> => {
    const response = await apiClient.post("/users/", user);
    return response.data;
  },

  update: async (
    id: number,
    user: UserUpdate
  ): Promise<MessageResponse<UserResponse>> => {
    const response = await apiClient.put(`/users/${id}`, user);
    return response.data;
  },

  getByUser: async (finder: string = ""): Promise<MessageResponse<UserResponse[]>> => {
    const response = await apiClient.get(`/users/by-user/?finder=${finder}`);
    return response.data;
  },

  // Método para asignar grupos de tablas a usuarios
  assignTablesGroupsToUser: async (
    userId: number,
    tablesGroupIds: number[]
  ): Promise<MessageResponse<{ user_id: number; assigned_tables_groups: number[] }>> => {
    const assignmentData: UserTablesGroupsAssignment = {
      user_id: userId,
      tables_group_ids: tablesGroupIds
    };
    
    const response = await apiClient.post(`/users/${userId}/assign-tables-groups`, assignmentData);
    return response.data;
  },

  // Nuevo método para obtener los grupos de tablas de un usuario
  getUserTablesGroups: async (
    userId: number
  ): Promise<MessageResponse<{ user_id: number; tables_group_ids: number[] }>> => {
    const response = await apiClient.get(`/users/${userId}/tables-groups`);
    return response.data;
  },

};