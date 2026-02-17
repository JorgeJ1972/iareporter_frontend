import apiClient from "./apiClient";
import { ChatConfig } from "../types/chat_config";
import MessageResponse from "../types/MessageResponse";

export const chatConfigService = {
  getConfig: async (): Promise<MessageResponse<ChatConfig>> => {

    const response = await apiClient.get(`/config/`);
    return response.data;
  },


updateConfig: async (
    config: ChatConfig
  ): Promise<MessageResponse<ChatConfig>> => {
    const response = await apiClient.put(`/config/update_config`, config);
    return response.data;
  },

createConfig: async (
    config: ChatConfig
  ): Promise<MessageResponse<ChatConfig>> => {
    const response = await apiClient.post(`/config/create_config`, config);
    return response.data;
  },
};