import { Toast } from 'primereact/toast';
import { HTTPException } from '../types/error'; // Importa el tipo de error del backend
import { AxiosError } from 'axios';
import i18n from '../i18next.ts';

export class MessageUtils {

  /**
   * Muestra un mensaje de éxito en un Toast, usando un mensaje personalizado si el código existe.
   * @param toastRef La referencia al componente Toast.
   * @param successCode El código de éxito (ej. "USER_CREATED_SUCCESS") enviado por el backend.
   * @param fallbackMessage Un mensaje por defecto si el código no se encuentra en el diccionario.
   */
  public static showSuccess(
    toastRef: React.RefObject<Toast | null>,
    detail?: string
  ) {
    toastRef.current?.show({
      severity: 'success',
      summary: i18n.t('common.successSummary'),
      detail: detail,
      life: 3000,
    });
  }

  /**
   * Muestra un mensaje de error en un Toast, usando un mensaje personalizado si el código de error existe.
   * @param toastRef La referencia al componente Toast.
   * @param errorCode El código de error (ej. "USER_ALREADY_EXISTS") enviado por el backend.
   * @param fallbackMessage Un mensaje por defecto si el código no se encuentra en el diccionario.
   */
  public static showError(
    toastRef: React.RefObject<Toast | null>,
    detail: string
  ) {

    toastRef.current?.show({
      severity: 'error',
      summary: i18n.t('common.errorSummary'),
      detail: detail,
      life: 5000,
    });
  }


  /**
 * Nuevo método helper para manejar errores de API de forma centralizada.
 */
  public static handleApiError(
    toastRef: React.RefObject<Toast | null>,
    error: unknown,
    contextKey?: string // Clave de traducción para el contexto, ej: 'actions.createUser'
  ) {
    console.error(`Error en API:`, error);
    if (error instanceof AxiosError && error.response) {
      const httpError = error.response.data as HTTPException;
      // Traduce el código de error del backend, usando el 'detail' como fallback.
      const detail = i18n.t(`errorMessages.${httpError.error_code}`, {
        defaultValue: httpError.detail,
      });
      MessageUtils.showError(toastRef, detail);
    } else {
      // Error de red o cualquier otro error no controlado
      const contextText = contextKey ? i18n.t(contextKey) : i18n.t('actions.defaultAction');
      const detail = i18n.t('errorMessages.UNEXPECTED_ERROR_WITH_CONTEXT', {
        context: contextText,
        defaultValue: i18n.t('errorMessages.UNEXPECTED_ERROR')
      });
      MessageUtils.showError(toastRef, detail);
    }
  }
}