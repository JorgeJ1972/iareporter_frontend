
import { ErrorCodes } from '../types/constants/ErrorCodes';

/**
 * Diccionario que traduce los códigos de error a mensajes amigables para el usuario.
 * La clave es el código de error que envía el backend.
 */

export const errorMessages: Record<string, string> = {

    // --- Errores de Autenticación (ej. AUTH_...) ---
  [ErrorCodes.INVALID_CREDENTIALS]: 'Las credenciales proporcionadas son incorrectas. Por favor, verifica tu correo y contraseña.',
  [ErrorCodes.ACCOUNT_DISABLED]: 'Tu cuenta ha sido desactivada. Contacta al administrador.',

  // Mensajes para validaciones del frontend
  [ErrorCodes.REQUIRED_NAME]: 'El nombre es un campo obligatorio.',
  [ErrorCodes.REQUIRED_EMAIL]: 'El correo electrónico es un campo obligatorio.',
  [ErrorCodes.REQUIRED_PASSWORD]: 'La contraseña es requerida.',
  [ErrorCodes.REQUIRED_ROL]: 'Debes seleccionar un rol para el usuario.',

  // Mensajes para errores del backend (el código viene de la API)
  [ErrorCodes.USER_ALREADY_EXISTS]: 'El correo electrónico que intentas registrar ya está en uso por otro usuario.',
  
  // Mensajes para errores generales
  [ErrorCodes.CONN_ERROR]: 'Error de conexión con el servidor. Por favor, revisa tu conexión a internet.',
  [ErrorCodes.UNEXPECTED_ERROR]: 'Ha ocurrido un error inesperado. Por favor, intenta de nuevo más tarde.',
};
