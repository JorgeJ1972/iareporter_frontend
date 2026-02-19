export interface MessageResponse<T> {
  //code(toastRef: RefObject<Toast | null>, code: any, message: string): unknown;
  status: number;
  result: T | null;
  message: string;
  success_code?: string; // Opcional, presente en respuestas de éxito
  error_code?: string;   // Opcional, presente en respuestas de error
}

export default MessageResponse;