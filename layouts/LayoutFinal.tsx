import React from "react";
import { Avatar } from "primereact/avatar";
import "./LayoutFinal.css";
import logoAIReporter from "../assets/AIReporter2.png";
import { Tooltip } from "primereact/tooltip";
import { motion } from "framer-motion";
import { getMenus, getUser, logout } from "../services/authService";
import { useLocation, useNavigate } from "react-router-dom";
import { UserResponse } from "../types/user";
import Menu from "../types/Menu";
import { useTranslation } from "react-i18next";
import { Button } from "primereact/button";
import { Sidebar } from "primereact/sidebar";
import { HandlerStorage } from "../utils/HandlerStorage";
import { logoutAzure } from "../services/azureAuthService";

type LayoutFinalProps = {
  children: React.ReactNode;
};

const LayoutFinal: React.FC<LayoutFinalProps> = ({ children }) => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: 'es' | 'en') => {
    i18n.changeLanguage(lng);
  };

  const navigate = useNavigate();
  const location = useLocation();
  const [groupedMenus, setGroupedMenus] = React.useState<Record<string, Menu[]>>({});
  const [isMenuVisible, setIsMenuVisible] = React.useState(window.innerWidth >= 992);
  const [user, setUser] = React.useState<UserResponse | null>(null);
  const [isDesktop, setIsDesktop] = React.useState(window.innerWidth >= 992);

  // Hook para detectar si estamos en vista de escritorio
  React.useEffect(() => {
    const updateMedia = () => {
      setIsDesktop(window.innerWidth >= 992);
    };
    window.addEventListener('resize', updateMedia);
    return () => window.removeEventListener('resize', updateMedia);
  }, []);

  // Cierra el menú en móviles cuando se navega a una nueva ruta
  React.useEffect(() => {
    if (!isDesktop) {
      setIsMenuVisible(false);
    }
  }, [location, isDesktop]);

  const logoutLocal = async () => {
    const loginMethod = new HandlerStorage().find('login_method', null);
    if (loginMethod === 'sso') {
      await logoutAzure(); // Cierra la sesión de Azure AD solo si el login fue por SSO
    }

    logout(); // Limpia los tokens locales
    new HandlerStorage().remove('login_method'); // Limpia la bandera del método de login
    navigate("/login");
  };

  React.useEffect(() => {
    const currentUser = getUser();
    setUser(currentUser);

    const menus = getMenus();

    // Agrupar el menú por la propiedad 'group'
    const groups = menus.reduce((acc, menu) => {
      // Asumimos que el campo de agrupación se llama 'group'. Si no existe, se agrupa en 'General'.
      const groupName = menu.group || 'general';
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(menu);
      return acc;
    }, {} as Record<string, Menu[]>);

    setGroupedMenus(groups);
  }, []);
  return (
    <>
      {/* Encabezado con Flexbox para mejor responsividad */}
      <header className="headers flex align-items-center justify-content-between p-3">
        {/* Sección Izquierda: Logo y Menú */}
        <div className="flex align-items-center gap-3">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
          >
            <div className="flex align-items-center">
              <Tooltip target=".menu-toggle-icon" />
              <i
                className="pi pi-bars menu-toggle-icon"
                data-pr-tooltip={t('layout.toggleMenuTooltip')}
                data-pr-position="right"
                onClick={() => setIsMenuVisible(!isMenuVisible)}
              />
              <img
                src={logoAIReporter}
                alt="AI REPORTER"
                className="logo-image"
              />
            </div>
          </motion.div>
        </div>

        {/* Sección Central: Título (se oculta en móviles con CSS) */}
        <div className="main-title-container">
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <div className="main-title">{t('layout.appTitle')}</div>
          </motion.div>
        </div>

        {/* Sección Derecha: Usuario y Acciones */}
        <div className="flex align-items-center">
          <motion.div
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
          >
            <div className="main-datas">
              <div>
                <Avatar icon="pi pi-user" size="large" shape="circle" />
              </div>
              <div className="data-style">
                <div className="data-user">{user?.full_name}</div>
                <div className="data-email">{user?.username}</div>
                <div className="data-role">{user?.role_name}</div>
              </div>
              <div className="header-actions">
                <div className="language-switcher flex gap-2">
                    <Button 
                      label="ES" 
                      onClick={() => changeLanguage('es')} 
                      className={`p-button-sm ${i18n.language === 'es' ? '' : 'p-button-outlined'}`}
                      tooltip={t('layout.switchToSpanish')}
                      tooltipOptions={{ position: 'bottom' }} />
                    <Button 
                      label="EN" 
                      onClick={() => changeLanguage('en')} 
                      className={`p-button-sm ${i18n.language === 'en' ? '' : 'p-button-outlined'}`}
                      tooltip={t('layout.switchToEnglish')}
                      tooltipOptions={{ position: 'bottom' }} />
                    <Button 
                      label="PT" 
                      onClick={() => changeLanguage('pt')} 
                      className={`p-button-sm ${i18n.language === 'pt' ? '' : 'p-button-outlined'}`}
                      tooltip={t('layout.switchToPortuguese')}
                      tooltipOptions={{ position: 'bottom' }} />
                </div>
                <div>
                  <Tooltip target="[data-pr-tooltip]" position="left" />
                  <i
                    className="pi pi-sign-out main-close-session"
                    data-pr-tooltip={t('layout.logoutTooltip')}
                    onClick={logoutLocal}
                  ></i>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </header>
      <div className="layout-wrapper">
        <Sidebar
          visible={isMenuVisible}
          onHide={() => setIsMenuVisible(false)}
          className="layout-sidebar"
          modal={!isDesktop} // En escritorio es "docked", en móvil es "modal"
        >
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
            >
              <div className="title-menu">{t('layout.mainMenuTitle')}</div>
            </motion.div>
  
            <motion.div
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              {Object.entries(groupedMenus).map(([groupName, menuItems]) => (
                <div key={groupName} className="menu-group">
                  <div className="menu-group-title">{t(`menuGroups.${groupName.toLowerCase()}`, { defaultValue: groupName.toUpperCase() })}</div>
                  {menuItems.map((menu) => (
                    <div className="menu-item" key={menu.route} onClick={() => navigate(menu.route)}>
                      <span className={`pi ${menu.icon} menu-icon`}></span>
                      <span className="menu-item-label">{t(menu.name, { defaultValue: menu.name })}</span>
                    </div>
                  ))}
                </div>
              ))}
  
              <div className="menu-item" onClick={logoutLocal}>
                <span className="pi pi-sign-out menu-icon"></span>{t('layout.logoutMenuItem')}
              </div>
            </motion.div>
        </Sidebar>
        <main className={`contenido ${isMenuVisible && isDesktop ? 'contenido-con-menu' : ''}`}>{children}</main>
      </div>
    </>
  );
};

export default LayoutFinal;
