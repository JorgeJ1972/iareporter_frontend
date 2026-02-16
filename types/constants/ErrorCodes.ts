/**
 * Centraliza todos los códigos de error de la aplicación para mantener la consistencia.
 */
export const ErrorCodes = {

    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',

    // Errores de Validación del Frontend
    REQUIRED_NAME: 'REQUIRED_NAME',
    REQUIRED_EMAIL: 'REQUIRED_EMAIL',
    REQUIRED_PASSWORD: 'REQUIRED_PASSWORD',
    REQUIRED_ROL: 'REQUIRED_ROL',

    USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
    // Errores Generales y de Conexión
    CONN_ERROR: 'CONN_ERROR',
    UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',
} as const;