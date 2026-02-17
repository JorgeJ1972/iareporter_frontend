import { useEffect, useState } from "react";
import {
  EnvironmentCreate,
  EnvironmentFormState,
  EnvironmentResponse,
  EnvironmentUpdate,
  DatabaseTypeResponse,
} from "../../types/environment";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import TypesCruds from "../../types/constants/TypeCruds";
import { MessageUtils } from "../../utils/MessageUtils";
import { Dropdown, type DropdownChangeEvent } from "primereact/dropdown";
import { environmentService } from "../../services/environmentService";
import { InputSwitch, type InputSwitchChangeEvent } from "primereact/inputswitch";
import { useGlobal } from "../../context/GlobalContext";
import { ErrorCodes } from "../../types/constants/ErrorCodes";
import { useTranslation } from "react-i18next";

interface EnvironmentCRUDProps {
  visible: boolean;
  onHide: () => void;
  typeCrud: string;
  environment: EnvironmentResponse | null;
  onSave: () => void;
}

const EnvironmentCRUD: React.FC<EnvironmentCRUDProps> = ({
  visible,
  onHide,
  typeCrud,
  environment,
  onSave,
}) => {
  const { t } = useTranslation();
  const { toastRef, setBlocked } = useGlobal();
  
  const EMPTY_ENVIRONMENT: EnvironmentFormState = {
    id: 0,
    name: "",
    description: "",
    connection_string: "",
    database_type_id: 1,
    is_enabled: true,
  };

  const [databaseTypes, setDatabaseTypes] = useState<DatabaseTypeResponse[]>([]);
  const [formEnvironment, setFormEnvironment] = useState<EnvironmentFormState>(EMPTY_ENVIRONMENT);

  useEffect(() => {
    const initializeForm = async () => {
      if (!visible) {
        setFormEnvironment(EMPTY_ENVIRONMENT);
        setDatabaseTypes([]);
        return;
      }

      setBlocked(true);
      try {
        // Cargar tipos de base de datos
        const response = await environmentService.getDatabaseTypes();
        setDatabaseTypes(response.result || []);

        // Configurar el formulario
        if (environment && typeCrud === TypesCruds.UPDATE) {
          setFormEnvironment({
            id: environment.id,
            name: environment.name,
            description: environment.description || "",
            connection_string: environment.connection_string || "",
            database_type_id: environment.database_type_id,
            is_enabled: environment.is_enabled,
          });
        } else {
          setFormEnvironment(EMPTY_ENVIRONMENT);
        }
      } catch (error) {
        MessageUtils.handleApiError(toastRef, error, t('actions.loadDatabaseTypes'));
        setDatabaseTypes([]);
      } finally {
        setBlocked(false);
      }
    };

    initializeForm();
  }, [visible, environment, typeCrud, setBlocked, toastRef, t]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormEnvironment({ ...formEnvironment, [name]: value });
  };

  const handleDatabaseTypeChange = (e: DropdownChangeEvent) => {
    setFormEnvironment({ ...formEnvironment, database_type_id: e.value });
  };

  const handleSwitchChange = (e: InputSwitchChangeEvent) => {
    setFormEnvironment({ ...formEnvironment, is_enabled: e.value || false });
  };

  // Función para testear la conexión
  const handleTestConnection = async () => {
    if (!formEnvironment.connection_string.trim()) {
      MessageUtils.showError(toastRef, t('environmentCRUD.testConnectionNoString'));
      return;
    }
    //console.log(`Testing connection for database type ID: ${formEnvironment.database_type_id}`);
    if ([1,3,5,6].includes(formEnvironment.database_type_id) === false) {
      MessageUtils.showError(toastRef, t('environmentCRUD.testConnectionOnlySQLServer'));
      return;
    }

    setBlocked(true);
    try {
      const response = await environmentService.testConnection(
        formEnvironment.database_type_id,
        formEnvironment.connection_string.trim()
      );
      
      if (response.result?.connected) {
        MessageUtils.showSuccess(toastRef, t('environmentCRUD.testConnectionSuccess'));
      } else {
        MessageUtils.showError(toastRef, t('environmentCRUD.testConnectionError') + ": " + response.message);
      }
    } catch (error) {
      MessageUtils.showError(toastRef, t('environmentCRUD.testConnectionError'));
    } finally {
      setBlocked(false);
    }
  };

  // Función para obtener el icono según el tipo de base de datos
  const getDatabaseIcon = (typeName: string) => {
    const type = typeName.toLowerCase();
    if (type.includes('sql server')) return '/src/assets/sql-server-icon.png';
    if (type.includes('mysql')) return '/src/assets/mysql-icon.png';
    if (type.includes('postgresql')) return '/src/assets/postgresql-icon.png';
    if (type.includes('oracle')) return '/src/assets/oracle-icon.png';
    return '/src/assets/database-icon.png'; // Icono por defecto
  };

  // Template para mostrar la opción seleccionada en el dropdown
  const selectedDatabaseTypeTemplate = (option: DatabaseTypeResponse) => {
    if (!option) return null;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img 
          src={getDatabaseIcon(option.name)} 
          alt="Database" 
          style={{ width: '20px', height: '20px' }}
        />
        <span>{option.name}</span>
      </div>
    );
  };

  // Template para mostrar las opciones en el dropdown
  const databaseTypeOptionTemplate = (option: DatabaseTypeResponse) => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img 
          src={getDatabaseIcon(option.name)} 
          alt="Database" 
          style={{ width: '20px', height: '20px' }}
        />
        <span>{option.name}</span>
      </div>
    );
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSave();
  };

  const validateForm = (): boolean => {
    if (!formEnvironment.name.trim()) {
      MessageUtils.showError(toastRef, t(`errorMessages.${ErrorCodes.REQUIRED_NAME}`));
      return false;
    }
    if (formEnvironment.database_type_id === 0) {
      MessageUtils.showError(toastRef, t('errorMessages.REQUIRED_DATABASE_TYPE'));
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setBlocked(true);
    try {
      if (typeCrud === TypesCruds.CREATE) {
        const newEnvironment: EnvironmentCreate = {
          name: formEnvironment.name.trim(),
          description: formEnvironment.description.trim(),
          connection_string: formEnvironment.connection_string.trim() || null,
          database_type_id: formEnvironment.database_type_id,
          is_enabled: formEnvironment.is_enabled,
        };
        const response = await environmentService.create(newEnvironment);
        const successMessage = t(`environmentCRUD.${response.success_code}`, {
          name: newEnvironment.name,
          defaultValue: response.message,
        });
        MessageUtils.showSuccess(toastRef, successMessage);
        onSave();
      } else {
        const dataToUpdate: EnvironmentUpdate = {
          id: formEnvironment.id,
          name: formEnvironment.name.trim(),
          description: formEnvironment.description.trim(),
          connection_string: formEnvironment.connection_string.trim() || null,
          database_type_id: formEnvironment.database_type_id,
          is_enabled: formEnvironment.is_enabled,
        };

        const response = await environmentService.update(
          formEnvironment.id,
          dataToUpdate
        );

        const successMessage = t(`environmentCRUD.${response.success_code}`, {
          name: dataToUpdate.name,
          defaultValue: response.message,
        });
        MessageUtils.showSuccess(toastRef, successMessage);
        onSave();
      }
      onHide();

    } catch (error) {
      const contextKey = typeCrud === TypesCruds.CREATE ? 'actions.createEnvironment' : 'actions.updateEnvironment';
      MessageUtils.handleApiError(toastRef, error, contextKey);
    } finally {
      setBlocked(false);
    }
  };

  const footer = (
    <div className="flex justify-end gap-2">
      <Button label={t('actions.cancel')} icon="pi pi-times" className="p-button-secondary" onClick={onHide} />
      <Button label={t('actions.save')} icon="pi pi-check" type="submit" form="environment-form" />
    </div>
  );

  return (
    <Dialog
      header={t(typeCrud === TypesCruds.CREATE ? 'environmentCRUD.addTitle' : 'environmentCRUD.editTitle')}
      visible={visible}
      modal
      onHide={onHide}
      style={{ width: '35rem' }}
      breakpoints={{ '960px': '75vw', '641px': '90vw' }}
      footer={footer}
    >
      <form id="environment-form" onSubmit={handleSubmit}>
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="name">{t('environmentCRUD.nameLabel')}</label>
            <InputText
              id="name"
              name="name"
              value={formEnvironment.name}
              onChange={handleInputChange}
              placeholder={t('environmentCRUD.namePlaceholder')}
            />
          </div>
          
          <div className="p-field">
            <label htmlFor="description">{t('environmentCRUD.descriptionLabel')}</label>
            <InputTextarea
              id="description"
              name="description"
              value={formEnvironment.description}
              onChange={handleInputChange}
              placeholder={t('environmentCRUD.descriptionPlaceholder')}
              rows={3}
              autoResize
            />
          </div>
          
          <div className="p-field">
            <label htmlFor="database_type_id">{t('environmentCRUD.databaseTypeLabel')}</label>
            <Dropdown
              id="database_type_id"
              value={formEnvironment.database_type_id}
              optionValue="id"
              optionLabel="name"
              options={databaseTypes}
              onChange={handleDatabaseTypeChange}
              placeholder={t('environmentCRUD.databaseTypePlaceholder')}
              valueTemplate={selectedDatabaseTypeTemplate}
              itemTemplate={databaseTypeOptionTemplate}
            />
          </div>
          
          <div className="p-field">
            <label htmlFor="connection_string">{t('environmentCRUD.connectionStringLabel')}</label>
              <InputTextarea
                id="connection_string"
                name="connection_string"
                value={formEnvironment.connection_string}
                onChange={handleInputChange}
                placeholder={t('environmentCRUD.connectionStringPlaceholder')}
                rows={3}
                autoResize
                className="flex-1"
              />
          </div>
          
          <div className="p-field flex items-center gap-2 mt-4">
            <InputSwitch
              id="is_enabled"
              checked={formEnvironment.is_enabled}
              onChange={handleSwitchChange}
            />
            <label htmlFor="is_enabled">{t('environmentCRUD.activeLabel')}</label>

            <div className="ml-auto">
              <Button
                type="button"
                label={t('environmentCRUD.testConnectionButton')}
                className="p-button-outlined"
                onClick={handleTestConnection}
                tooltip={t('environmentCRUD.testConnectionButton')}
                tooltipOptions={{ position: 'top' }}
                disabled={formEnvironment.database_type_id !== 1 && formEnvironment.database_type_id !== 3 && formEnvironment.database_type_id !== 5  && formEnvironment.database_type_id !== 6}
              />
            </div>
          </div>
        </div>
      </form>
    </Dialog>
  );
};

export default EnvironmentCRUD;
