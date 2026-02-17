import { useEffect, useState } from "react";
import {
  TablesGroupCat,
  TablesGroupCatInsert,
  TablesGroupFormState,
} from "../../types/tableGroupt";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import TypesCruds from "../../types/constants/TypeCruds";
import { MessageUtils } from "../../utils/MessageUtils";
import { tablesGroupService } from "../../services/tablesGroupService";
import { InputSwitch, type InputSwitchChangeEvent } from "primereact/inputswitch";
import { useGlobal } from "../../context/GlobalContext";
import { useTranslation } from "react-i18next";

interface TablesGroupCRUDProps {
  visible: boolean;
  onHide: () => void;
  typeCrud: string;
  tablesGroup: TablesGroupCat | null;
  environmentId: number;
  onSave: () => void;
}

const TablesGroupCRUD: React.FC<TablesGroupCRUDProps> = ({
  visible,
  onHide,
  typeCrud,
  tablesGroup,
  environmentId,
  onSave,
}) => {
  const { t } = useTranslation();
  const { toastRef, setBlocked } = useGlobal();
  
  const EMPTY_TABLES_GROUP: TablesGroupFormState = {
    id: 0,
    name: "",
    description: "",
    environment_id: environmentId,
    prompt_system: "",
    is_enabled: true,
  };

  const [formTablesGroup, setFormTablesGroup] = useState<TablesGroupFormState>(EMPTY_TABLES_GROUP);

  useEffect(() => {
    const initializeForm = async () => {
      if (!visible) {
        setFormTablesGroup(EMPTY_TABLES_GROUP);
        return;
      }

      setBlocked(true);
      try {
        if (tablesGroup && typeCrud === TypesCruds.UPDATE) {
          setFormTablesGroup({
            id: tablesGroup.id,
            name: tablesGroup.name,
            description: tablesGroup.description,
            environment_id: tablesGroup.environment_id,
            prompt_system: tablesGroup.prompt_system,
            is_enabled: tablesGroup.is_enabled,
          });
        } else {
          setFormTablesGroup({
            ...EMPTY_TABLES_GROUP,
            environment_id: environmentId,
          });
        }
      } catch (error) {
        MessageUtils.handleApiError(toastRef, error, t('actions.loadTablesGroup'));
      } finally {
        setBlocked(false);
      }
    };

    initializeForm();
  }, [visible, tablesGroup, typeCrud, environmentId, setBlocked, toastRef, t]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormTablesGroup({ ...formTablesGroup, [name]: value });
  };

  const handleSwitchChange = (e: InputSwitchChangeEvent) => {
    setFormTablesGroup({ ...formTablesGroup, is_enabled: e.value || false });
  };

  const handleSave = async () => {
    if (!formTablesGroup.name.trim()) {
      MessageUtils.showError(toastRef, t('common.nameRequired'));
      return;
    }

    if (!formTablesGroup.description.trim()) {
      MessageUtils.showError(toastRef, t('common.descriptionRequired'));
      return;
    }

    setBlocked(true);
    try {
      if (typeCrud === TypesCruds.CREATE) {
        const createData: TablesGroupCatInsert = {
          name: formTablesGroup.name.trim(),
          description: formTablesGroup.description.trim(),
          environment_id: formTablesGroup.environment_id,
          prompt_system: "",
          is_enabled: formTablesGroup.is_enabled,
        };

        const response = await tablesGroupService.create(createData);
        const successMessage = t(`tablesGroupCRUD.${response.success_code}`, {
          name: formTablesGroup.name,
          defaultValue: response.message,
        });
        MessageUtils.showSuccess(toastRef, successMessage);
      } else if (typeCrud === TypesCruds.UPDATE) {
        const updateData: TablesGroupCat = {
          id: formTablesGroup.id,
          name: formTablesGroup.name.trim(),
          description: formTablesGroup.description.trim(),
          environment_id: formTablesGroup.environment_id,
          prompt_system: formTablesGroup.prompt_system,
          is_enabled: formTablesGroup.is_enabled,
        };

        const response = await tablesGroupService.update(updateData);
        const successMessage = t(`tablesGroupCRUD.${response.success_code}`, {
          name: formTablesGroup.name,
          defaultValue: response.message,
        });
        MessageUtils.showSuccess(toastRef, successMessage);
      }

      onSave();
      onHide();
    } catch (error) {
      MessageUtils.handleApiError(toastRef, error, t('actions.saveTablesGroup'));
    } finally {
      setBlocked(false);
    }
  };

  const renderFooter = () => (
    <div>
      <Button
        label={t('actions.cancel')}
        icon="pi pi-times"
        className="p-button-text"
        onClick={onHide}
      />
      <Button
        label={t('actions.save')}
        icon="pi pi-check"
        className="p-button-success"
        onClick={handleSave}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      style={{ width: '50rem' }}
      header={typeCrud === TypesCruds.CREATE ? t('tablesGroupCRUD.addTitle') : t('tablesGroupCRUD.editTitle')}
      modal
      className="p-fluid"
      footer={renderFooter}
      onHide={onHide}
    >
      <div className="p-field">
        <label htmlFor="name">{t('tablesGroupCRUD.nameLabel')}</label>
        <InputText
          id="name"
          name="name"
          value={formTablesGroup.name}
          onChange={handleInputChange}
          placeholder={t('tablesGroupCRUD.namePlaceholder')}
          required
        />
      </div>

      <div className="p-field">
        <label htmlFor="description">{t('tablesGroupCRUD.descriptionLabel')}</label>
        <InputTextarea
          id="description"
          name="description"
          value={formTablesGroup.description}
          onChange={handleInputChange}
          placeholder={t('tablesGroupCRUD.descriptionPlaceholder')}
          rows={3}
          required
        />
      </div>

      <div className="p-field flex items-center gap-2 mt-4">
        <InputSwitch
          id="is_enabled"
          checked={formTablesGroup.is_enabled}
          onChange={handleSwitchChange}
        />
        <label htmlFor="is_enabled">{t('tablesGroupCRUD.activeLabel')}</label>
      </div>
    </Dialog>
  );
};

export default TablesGroupCRUD;