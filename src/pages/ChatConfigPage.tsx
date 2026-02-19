import React, { useState, useRef, useCallback, FormEvent, useEffect } from 'react';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useTranslation } from 'react-i18next';
import { useGlobal } from '../context/GlobalContext';
import { motion } from 'framer-motion';
import { RadioButton } from 'primereact/radiobutton';
import { chatConfigService } from "../services/chatConfigService";
import {ChatConfig} from "../types/chat_config";
import {ConfigExport} from "../types/constants/ConfigExport";
import { MessageUtils } from "../utils/MessageUtils";
import { type DropdownChangeEvent } from "primereact/dropdown";


const ChatConfigPage: React.FC = () => {
  const { t } = useTranslation();
  const { toastRef, setBlocked } = useGlobal();
  const [chatConfig, setChatConfig] = useState<ChatConfig | undefined>();

  const loadDatas = useCallback(async () => {
    setBlocked(true);
    try {
      const response = await chatConfigService.getConfig();
      setChatConfig(response.result || undefined);
    } catch (error) {
      // Usamos el manejador centralizado que mostrará el error correcto.
      MessageUtils.handleApiError(toastRef, error, t('actions.loadUsers'));
      setChatConfig(undefined); // Limpiar datos en caso de error para evitar mostrar información obsoleta.
    } finally {
      setBlocked(false);
    }
  }, [setBlocked, toastRef, t]); // Dependencias de useCallback 

  useEffect(() => {
    loadDatas();
  }, [loadDatas]);

  const handleExportTableChange = (e: DropdownChangeEvent) => {
    if (chatConfig) {
      setIsSaving(true)
      setChatConfig({ ...chatConfig, table_export: e.value });
    }
  };
  const handleExportGraphicsChange = (e: DropdownChangeEvent) => {
    if (chatConfig) {
      setIsSaving(true)
      setChatConfig({ ...chatConfig, graphic_export: e.value });
    }
  };
  const handleLanguageChange = (e: DropdownChangeEvent) => {
    if (chatConfig) {
      setIsSaving(true)  
      setChatConfig({ ...chatConfig, language: e.value });
    }
  };
  const setChecked = (e: DropdownChangeEvent) => {
    if (chatConfig) {
      setIsSaving(true)
      setChatConfig({ ...chatConfig, include_voice: e.checked ? true : false });
    }
  };

  const handleColorsChange = (e: DropdownChangeEvent) => {
    if (chatConfig) {
      setIsSaving(true)  
      setChatConfig({ ...chatConfig, colors: e.value });
    }
  };

  const [isSaving, setIsSaving] = useState(false);
  const [, setError] = useState<string | null>(null);
  const toastRefLocal = useRef<Toast | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    if (!chatConfig) {
      setError(t('actions.saveError'));
      setIsSaving(false);
      return;
    }
    console.log('Chat Config:', chatConfig);
    chatConfigService.updateConfig(chatConfig)
      .then(() => {
        console.log('Updated successfully:',t('chatConfig.saveSuccess'));
        MessageUtils.showSuccess(toastRef, t('actions.saveSuccess'));
      })
      .catch((error) => {
        MessageUtils.handleApiError(toastRef, error, t('actions.saveError'));
        setError(t('actions.saveError'));
      })
      .finally(() => {
        setIsSaving(false);
      });
  }

    return (
        <>
      <Toast ref={toastRefLocal} />
      <motion.div
        initial={{ opacity: 0, x: 120 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
      >
        <h1>{t('chatConfig.title')}</h1>
      </motion.div>
      <form id="chat-config-form" onSubmit={handleSubmit}>
        <div className="p-fluid">
            <div className="p-field">
              <label htmlFor="export_table"><b>{t('chatConfig.tableExport')}</b></label>
            </div>
            <div className="flex flex-wrap justify-content-left gap-3">
            {ConfigExport.export_tables_list.map((item) => (

                    <div className="flex align-items-center" key={item.value}>
                        <RadioButton
                        onChange={(e) => handleExportTableChange(e)} checked={chatConfig?.table_export === item.key}
                        inputId={`export_table_${item.value}`}
                        name="export_table"
                        value={item.key}
                        />
                        <label htmlFor={`export_table_${item.value}`} className="ml-2">
                        {item.value}
                        </label>
                    </div>
                
            ))}
            </div>
           <div className="flex align-items-center">
             <span><br></br></span>
           </div>
           <div className="p-field">
             <label htmlFor="export_graphic"><b>{t('chatConfig.graphicExport')}</b></label>
           </div>
           <div className="flex flex-wrap justify-content-left gap-3">
            {ConfigExport.export_graphics_list.map(( item ) => (
                
                    <div className="flex align-items-center" key={item.value}>
                        <RadioButton
                        onChange={(e) => handleExportGraphicsChange(e)} checked={chatConfig?.graphic_export === item.key}
                        inputId={`export_graphic_${item.value}`}
                        name="export_graphic"
                        value={item.key}
                        />
                        <label htmlFor={`export_graphic_${item.value}`} className="ml-2">
                        {item.value}
                        </label>
                    </div>
                
            ))}
            </div>
            <div className="flex align-items-center">
              <span><br></br> </span>
            </div>
            <div className="p-field">
              <label htmlFor="language"><b>{t('chatConfig.language')}</b></label>
            </div>
            <div className="flex flex-wrap justify-content-left gap-3">
            {ConfigExport.export_languages_list.map(( item ) => (
                
                    <div className="flex align-items-center" key={item.value}>
                        <RadioButton
                        onChange={(e) => handleLanguageChange(e)} checked={chatConfig?.language === item.key}
                        inputId={`export_language_${item.value}`}
                        name="export_language"
                        value={item.key}
                        />
                        <label htmlFor={`export_language_${item.value}`} className="ml-2">{item.value}</label>
                    </div>
                
            ))}
            </div>
            <div className="flex align-items-center">
              <span><br></br></span>
            </div>
            <div className="p-field">
              <div className="flex align-items-center">
                  <Checkbox checked={!!chatConfig?.include_voice} onChange={e => setChecked(e)}></Checkbox>&nbsp;
                  <label htmlFor="include_voice"><b> {t('chatConfig.includeVoice')} </b></label>
              </div>
            </div>  
            <div className="flex align-items-center">
              <span><br></br></span>
            </div>
            <div className="p-field">
              <label htmlFor="colors"><b>{t('chatConfig.colors')}</b></label>
            </div>
            <div className="flex flex-wrap justify-content-left gap-3">
            {ConfigExport.export_colors_list.map((item) => (
                
                    <div className="flex align-items-center" key={item.value}>
                        <RadioButton
                        onChange={(e) => handleColorsChange(e)} checked={chatConfig?.colors === item.key}
                        inputId={`colors_${item.value}`}
                        name="colors"
                        value={item.key}
                        />
                        <label htmlFor={`colors_${item.value}`} className="ml-2">
                        {item.value}
                        </label>
                    </div>
                
            ))}
            </div>
            <div className="flex align-items-center">
              <span><br></br></span>
            </div>
    
            <div className="flex justify-content-start">
              <Button
                type="submit"
                disabled={!isSaving}
                className="chat-config-button"
                label={t('actions.save')}
                icon="pi pi-save"
                style={{ width: 'auto' }}
              />
            </div>
        </div>
      </form>
    </>

    );
};
    export default ChatConfigPage;