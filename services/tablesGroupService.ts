import MessageResponse from "../types/MessageResponse";
import { TableGroup, TablesGroupCat, TablesGroupCatInsert } from "../types/tableGroupt";
import apiClient from "./apiClient";

export const tablesGroupService = {
  getByUserId: async (id: number): Promise<MessageResponse<TableGroup[]>> => {
    const response = await apiClient.get(`/tables_group/${id}`);
    return response.data;
  },

  // Get tables groups by environment ID
  getTablesGroupAll: async (): Promise<MessageResponse<TablesGroupCat[]>> => {
    const response = await apiClient.get(`/tables_group`);
    return response.data;
  },

  // Get single tables group by ID
  getByTablesGroupId: async (tablesGroupId: number): Promise<MessageResponse<TablesGroupCat>> => {
    const allTablesGroupsResponse = await apiClient.get(`/tables_group`);
    const allTablesGroups: TablesGroupCat[] = allTablesGroupsResponse.data.result;
    const tablesGroup = allTablesGroups.find(tg => tg.id === tablesGroupId);
    
    if (!tablesGroup) {
      return {
        status: 404,
        result: null,
        message: "Tables group not found",
        error_code: "TABLES_GROUP_NOT_FOUND"
      };
    }
    
    return {
      status: 200,
      result: tablesGroup,
      message: "Tables group found successfully",
      success_code: "TABLES_GROUP_GET_SUCCESS"
    };
  },

  
  // Get tables groups by environment ID
  getByEnvironmentId: async (environmentId: number): Promise<MessageResponse<TablesGroupCat[]>> => {
    const response = await apiClient.get(`/tables_group/by_environment_id/${environmentId}`);
    return response.data;
  },

  // Create new tables group
  create: async (tablesGroup: TablesGroupCatInsert): Promise<MessageResponse<TablesGroupCat>> => {
    const response = await apiClient.post("/tables_group/", tablesGroup);
    return response.data;
  },

  // Update existing tables group
  update: async (tablesGroup: TablesGroupCat): Promise<MessageResponse<TablesGroupCat>> => {
    const response = await apiClient.put("/tables_group/", tablesGroup);
    return response.data;
  },

  // Delete tables group
  delete: async (tablesGroupId: number): Promise<MessageResponse<void>> => {
    const response = await apiClient.delete(`/tables_group/${tablesGroupId}`);
    return response.data;
  },

  // Update prompt system using stored procedure
  updatePromptSystem: async (tablesGroupId: number): Promise<MessageResponse<any>> => {
    const response = await apiClient.post(`/tables_group/update-prompt-system/${tablesGroupId}`);
    return response.data;
  },
};