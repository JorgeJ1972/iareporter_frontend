export interface ChatResponse {
  user: string;
  environment: {
    environment_id: number;
    tables_group_id: number;
  };
  messages: ChatMessage[];
  created: string;
  upated: string | null;
  closed: string | null;
}


//Est es el mensaje que va esta regresando dentro
export interface ChatMessage {
  text: string;
  type: "B" | "U"; // Bot or User
  voice: boolean;
  language: string;
  attachments: any[]; // You might want to define a more specific type for attachments
  data_response: any; // You might want to define a more specific type for data_response
  query: string | null;
  columns: any[]; // You might want to define a more specific type for columns
  graphics: any[]; // You might want to define a more specific type for graphics
  status: "pending" | "completed" | "failed"; // Example statuses
  created: string;
  received: string | null;
}


