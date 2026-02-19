import { ChatResponse } from "../types/chat";
import { ConversationRequest, ApiConversation } from "../types/chatApi";
import MessageResponse from "../types/MessageResponse";
import apiClient from "./apiClient";

export const chatService = {
  streamMessage: async (
    payload: ConversationRequest,
    onEvent: (event: { type: "status" | "token" | "table" | "attachment" | "end" | "error" | "query", value: any }) => void,
    onDone?: () => void,
    onError?: (error: any) => void
  ) => {
    try {
      let token = localStorage.getItem('token');
      if (!token || token === "undefined" || token === "null" || token.trim() === "") {
        try {
          const { default: NamesStorage } = await import("../types/constants/NamesStorage");
          const { HandlerStorage } = await import("../utils/HandlerStorage");
          const storage = new HandlerStorage<string>();
          token = storage.find(NamesStorage.TOKEN, "");
        } catch {} 
      }
      if (!token || token === "undefined" || token === "null" || token.trim() === "") {
        throw new Error("No se encontró un token válido para autenticación");
      }
      //const response = await fetch("http://localhost:8000/chat/stream_message", {
      const response = await fetch("https://red-mushroom-076d2a50f.1.azurestaticapps.net/chat/stream_message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      if (!response.body) throw new Error("No stream body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = "";
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          buffer += decoder.decode(value);
          const eventDelimiter = /\n\n/;
          let events = buffer.split(eventDelimiter);

          if (!buffer.endsWith("\n\n")) {
            buffer = events.pop() || "";
          } else {
            buffer = "";
          }

          for (const eventString of events) {
            if (eventString.startsWith("data: ")) {
              const jsonData = eventString.substring(6);
              try {
                const event = JSON.parse(jsonData);
                if (event.type === 'end') {
                    onEvent({ type: "end", value: null });
                    done = true; // Terminar el bucle
                } else {
                    onEvent({ type: event.type, value: event.payload });
                }
              } catch (e) {
                console.error("Error parsing JSON from stream: ", jsonData);
              }
            }
          }
        }
      }
      if (onDone) onDone();
    } catch (error) {
      if (onError) onError(error);
    }
  },
  createCoversation: async (
    idTablesGroup: number,
    language: string
  ): Promise<MessageResponse<ApiConversation>> => { // Asumimos que crea y devuelve una conversación
    const response = await apiClient.post(`/chat/create_coversation?id_tables_group=${idTablesGroup}&language=${language}`);
    return response.data;
  },

  addMessages: async (
    payload: ConversationRequest
  ): Promise<MessageResponse<ApiConversation>> => {
    const response = await apiClient.post(`/chat/add_message`, payload);
    return response.data;
  },


  getById: async (
    id: number
  ): Promise<MessageResponse<ChatResponse>> => {
    const response = await apiClient.get(`/chat/${id}`);
    return response.data;
  },

  delete: async (
    id: number
  ): Promise<MessageResponse<void>> => {
    const response = await apiClient.delete(`/chat/${id}`);
    return response.data;
  },

  create: async (
    user: ChatResponse
  ): Promise<MessageResponse<ChatResponse>> => {
    const response = await apiClient.post("/chat/", user);
    return response.data;
  },

  update: async (
    id: number,
    user: ChatResponse
  ): Promise<MessageResponse<ChatResponse>> => {
    const response = await apiClient.put(`/chat/${id}`, user);
    return response.data;
  },

};
