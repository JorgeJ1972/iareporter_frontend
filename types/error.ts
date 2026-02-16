// src/types/error.ts 
export interface HTTPException {
  detail: string;       // Mensaje de error principal
  error_code?: string;  // Código de error interno de la aplicación
  // Puedes añadir más campos si el backend los envía
}