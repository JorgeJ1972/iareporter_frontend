import { FileData } from "../types/fileData";
import MessageResponse from "../types/MessageResponse";
import apiClient from "./apiClient";

export const fileService ={
    textFromFile: async (fileData: FileData): Promise<MessageResponse<string>> => {
        const response = await apiClient.post<MessageResponse<string>>("/files/text-from-file", fileData);
        return response.data;
      },
}