import React, { createContext, useState, useRef, useContext, ReactNode } from 'react';
import { Toast } from 'primereact/toast';
import { BlockUI } from 'primereact/blockui';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useTranslation } from 'react-i18next';

interface GlobalContextType {
  blocked: boolean; 
  setBlocked: (blocked: boolean) => void;
  toastRef: React.RefObject<Toast | null>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [blocked, setBlocked] = useState(false);
  const toastRef = useRef<Toast>(null);
  const { t } = useTranslation();

  // 1. Plantilla personalizada para el ícono de carga.
  // Se usa ProgressSpinner de PrimeReact para mantener la consistencia visual.
  const loaderTemplate = (
    <div className="flex flex-column align-items-center" style={{ color: 'white' }}>
      <ProgressSpinner style={{ width: '60px', height: '60px' }} strokeWidth="6" />
      <p className="mt-3 text-lg">{t('loading')}</p>
    </div>
  );

  return (
    <GlobalContext.Provider value={{ blocked, setBlocked, toastRef }}>
      <Toast ref={toastRef} />
      {/* 2. Se actualiza BlockUI para que ocupe toda la pantalla y use la plantilla del spinner. */}
      <BlockUI blocked={blocked} fullScreen template={loaderTemplate}>
        {children}
      </BlockUI>
    </GlobalContext.Provider>
  );
};

//Hook
export const useGlobal = (): GlobalContextType => {
  const context = useContext(GlobalContext);
  const { t } = useTranslation();
  if (context === undefined) {
    throw new Error(t('errorMessages.GLOBAL_PROVIDER_MISSING'));
  }
  return context;
};