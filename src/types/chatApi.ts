export interface Attachment {
    type: string;
    name: string;
    path: string;
  }
  
  export interface ApiMessage {
    text: string;
    type: 'U' | 'B';
    voice: boolean;
    language: string;
    attachments: Attachment[];
    data_response: any;
    query: string;
    columns: any[];
    graphics: any[];
    status: string;
    created: string;
    received: string;
  }
  
  export interface ApiConversation {
    conversation_id: number;
    user_id: number;
    environment_id: number;
    title: string;
    messages: ApiMessage[];
    created: string;
    updated: string;
  }
  
  export interface ConversationRequest {
      message: ApiMessage;
      conversation: ApiConversation;
  }