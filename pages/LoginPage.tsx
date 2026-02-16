import React, { useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Tooltip } from "primereact/tooltip";
import { Checkbox } from "primereact/checkbox";
import { Card } from "primereact/card";
import logoAIReporter from "../assets/AIReporter.png";
import { loginWithAzurePopup } from "../services/azureAuthService";
import { login, checkAuthStatus, loginWithAzureSSO } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useGlobal } from "../context/GlobalContext";
import { HandlerStorage } from "../utils/HandlerStorage.ts";
import { NamesStorage } from "../types/constants/NamesStorage.ts";
import { MessageUtils } from "../utils/MessageUtils.ts";
import type MessageResponse from "../types/MessageResponse";
import type TokenResponse from "../types/TokenResponse";
import { useTranslation } from "react-i18next";
import "./LoginPage.css";

const REMEMBER_ME_KEY = 'rememberedEmail';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { setBlocked, toastRef } = useGlobal();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(false);

  // Al montar el componente, revisamos si hay un correo guardado.
  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBER_ME_KEY);
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []); // El array vacío asegura que esto solo se ejecute una vez.

  useEffect(()=>{
    // Muestra el Toast si hemos sido redirigidos por sesión expirada.
    const expirationReason = sessionStorage.getItem('session_expired_reason');
    if (expirationReason) {
      toastRef.current?.show({
        severity: 'warn',
        summary: t('session.expiredTitle'),
        detail: expirationReason,
        life: 5000,
      });
      // Limpiamos el motivo para que el mensaje no reaparezca si el usuario recarga la página.
      sessionStorage.removeItem('session_expired_reason');
    }

    // Redirige si el usuario ya está autenticado.
    if(checkAuthStatus().isAuthenticated){
      navigate("/main");
    }
  },[navigate, toastRef])

  const showResponseError = (response: MessageResponse<TokenResponse>) => {
    const detail = t(`errorMessages.${response.error_code}`, { defaultValue: response.message });
    MessageUtils.showError(toastRef, detail);
  };

  const handleSuccessfulLogin = (response: MessageResponse<TokenResponse>) => {
    if (!response.result) {
      showResponseError(response);
      return;
    }

    const { token, user, menu } = response.result;
    new HandlerStorage().save(NamesStorage.TOKEN, token);
    new HandlerStorage().save(NamesStorage.USER, user);
    new HandlerStorage().save(NamesStorage.MENU, menu);


    const successMessage = t(`successMessages.${response.success_code}`, {
      defaultValue: response.message,
      full_name: user.full_name
    });
    MessageUtils.showSuccess(toastRef, successMessage);
    navigate("/main");
  };

  const changeLanguage = (lng: 'es' | 'en' | 'pt') => {
    i18n.changeLanguage(lng);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    new HandlerStorage().save('login_method', 'local'); // Guardamos que el login fue local
    // Guardamos o eliminamos el correo según la selección del usuario.
    if (rememberMe) {
      localStorage.setItem(REMEMBER_ME_KEY, email);
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY);
    }

    setBlocked(true);
    try {
      const response = await login(email, password);

      if (response.result) {
        handleSuccessfulLogin(response);
      } else {
        showResponseError(response);
      }
    } catch (error: any) {
      // Esto captura errores de red o errores 500 del servidor
      if (error.response && error.response.data) {
        const detail = t(`errorMessages.${error.response.data.error_code}`, {
          defaultValue: error.response.data.message,
        });
        MessageUtils.showError(toastRef, detail);
      } else {
        MessageUtils.showError(toastRef, t('errorMessages.CONN_ERROR'));
      }
    } finally {
      setBlocked(false);
    }
  };

  const handleAzureLogin = async () => {
    let shouldUnblock = false;
    try {
      const authResult = await loginWithAzurePopup();
      if (!authResult.idToken) {
        MessageUtils.showError(toastRef, t('login.ssoNoIdToken'));
        return;
      }

      setBlocked(true);
      shouldUnblock = true;

      const response = await loginWithAzureSSO(authResult.idToken);
      if (response.result) {
        new HandlerStorage().save('login_method', 'sso'); // Guardamos que el login fue por SSO
        handleSuccessfulLogin(response);
      } else {
        showResponseError(response);
      }
    } catch (error: any) {
      if (error?.message === 'AZURE_AD_NOT_CONFIGURED') {
        MessageUtils.showError(toastRef, t('login.ssoNotConfigured'));
        return;
      }

      if (error?.errorCode === 'interaction_in_progress') {
         MessageUtils.showError(toastRef, t('login.ssoInteractionInProgress'));
         return;
      }
      
      if (typeof error === 'object' && error && 'errorCode' in error) {
        const { errorCode } = error as { errorCode: string };
        if (errorCode === 'user_cancelled' || errorCode === 'user_cancelled_login') {
          return;
        }
        if (errorCode === 'popup_window_error') {
          MessageUtils.showError(toastRef, t('login.ssoPopupBlocked'));
          return;
        }
      }

      MessageUtils.handleApiError(toastRef, error, 'login.ssoButton');
    } finally {
      if (shouldUnblock) {
        setBlocked(false);
      }
    }
  };

  const header = (
    <div className="text-center">
      <h2 style={{ color: "#004AAC" }}>{t('login.title')}</h2>
      <div className="logo-container">
        <img
          src={logoAIReporter}
          alt="AI REPORTER"
          className="logo-image"
          style={{ 
            width: '150px', 
            height: '150px', 
            objectFit: 'contain',
            display: 'block',
            margin: '0 auto'
          }}
        />
      </div>
      <p style={{ color: "#495057" }}>
        {t('login.subtitle')}
      </p>
    </div>
  );

  return (
    <>
      <Tooltip target="[data-pr-tooltip]" />
     { (<motion.div
        initial={{ opacity: 0, y:-80 }}
        animate={{ opacity: 1, y:0 }}
        transition={{ duration: 1 }}
      >
        <div className="flex align-items-center justify-content-center h-screen bg-gray-100">
          <div style={{ position: 'absolute', top: '1rem', right: '1rem' }} className="language-switcher flex gap-2">
            <Button label="ES" onClick={() => changeLanguage('es')} className={`p-button-sm ${i18n.language === 'es' ? '' : 'p-button-outlined'}`}  tooltip={t('layout.switchToSpanish')} tooltipOptions={{ position: 'bottom' }} />
            <Button label="EN" onClick={() => changeLanguage('en')} className={`p-button-sm ${i18n.language === 'en' ? '' : 'p-button-outlined'}`}  tooltip={t('layout.switchToEnglish')} tooltipOptions={{ position: 'bottom' }} />
            <Button label="PT" onClick={() => changeLanguage('pt')} className={`p-button-sm ${i18n.language === 'pt' ? '' : 'p-button-outlined'}`}  tooltip={t('layout.switchToPortuguese')} tooltipOptions={{ position: 'bottom' }} />
            
          </div>
          <Card
            className="col-12 md:col-6 lg:col-4 p-fluid"
            header={header}
            style={{
              borderRadius: "12px",
              boxShadow:
                "rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px",
              backgroundColor: "rgba(var(--primary-color-rgb),.2)",
            }}
          >
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label
                  htmlFor="email"
                  className="block text-900 text-xl font-medium mb-2"
                >
                  {t('login.emailLabel')}
                </label>
                <div className="p-inputgroup flex-1">
                  <span className="p-inputgroup-addon">
                    <i className="pi pi-envelope"></i>
                  </span>
                  <InputText
                    id="email"
                    type="email"
                    placeholder={t('login.emailPlaceholder')}
                    value={email}
                    autoComplete="email"
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full"
                    style={{ borderRadius: "0px 8px 8px 0px", padding: "12px" }}
                  />
                </div>
              </div>
              <div className="field">
                <div className="flex justify-content-between align-items-center mb-2">
                  <label
                    htmlFor="password"
                    className="block text-900 text-xl font-medium"
                  >
                    {t('login.passwordLabel')}
                  </label>
                  <button
                    type="button"
                    className="text-blue-500 cursor-pointer hover:underline border-none p-0 bg-transparent"
                    style={{ fontSize: "0.9rem" }}
                    onClick={() => {
                      /* TODO: Implementar lógica para recuperar contraseña */
                    }}
                  >
                    {t('login.forgotPassword')}
                  </button>
                </div>
                <div className="p-inputgroup flex-1">
                  <span className="p-inputgroup-addon">
                    <i className="pi pi-lock"></i>
                  </span>
                  <Password
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder={t('login.passwordPlaceholder')}
                    feedback={false}
                    toggleMask
                    tooltipOptions={{ position: 'right' }}
                    pt={{
                      toggler: (options) => ({
                        'data-pr-tooltip': options.state.mask ? t('login.showPasswordTooltip') : t('login.hidePasswordTooltip')
                      }),
                      input: {
                        style: { borderRadius: "0px 8px 8px 0px", padding: "12px" }
                      }
                    }}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="field-checkbox mb-4">
                <Checkbox
                  inputId="rememberme"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.checked ?? false)}
                />
                <label
                  htmlFor="rememberme"
                  className="ml-2 text-900 font-medium"
                >
                  {t('login.rememberMe')}
                </label>
              </div>
              <Button
                type="submit"
                label={t('login.loginButton')}
                className="p-button-raised p-button-primary w-full"
                style={{
                  backgroundColor: "#004AAC",
                  borderColor: "#004AAC",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "1rem",
                }}
              />
              <Button
                type="button"
                label={t('login.ssoButton')}
                icon="pi pi-microsoft"
                className="p-button-outlined p-button-secondary w-full mt-3"
                onClick={handleAzureLogin}
                disabled={useGlobal().blocked}
              />
            </form>
          </Card>
        </div>
      </motion.div>)}
    </>
  );
};

export default LoginPage;
