import { useEffect, useState } from "react";
import {
  UserCreate,
  UserFormState,
  UserResponse,
  UserUpdate,
} from "../../types/user";
import { Password } from "primereact/password";

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import TypesCruds from "../../types/constants/TypeCruds";
import { MessageUtils } from "../../utils/MessageUtils";
import { Dropdown, type DropdownChangeEvent } from "primereact/dropdown";
import { userService } from "../../services/userService";
import { RolResponse } from "../../types/rol";
import React from "react";
import { rolService } from "../../services/rolService";
import { Checkbox, type CheckboxChangeEvent } from "primereact/checkbox";
import { useGlobal } from "../../context/GlobalContext";
import { ErrorCodes } from "../../types/constants/ErrorCodes";
import { useTranslation } from "react-i18next";
import { Tooltip } from "primereact/tooltip";



interface UserCRUDProps {
  visible: boolean;
  onHide: () => void;
  typeCrud: string;
  user: UserResponse | null;
  onSave: (user: UserCreate | UserUpdate) => void;
}

const UserCRUD: React.FC<UserCRUDProps> = ({
  visible,
  onHide,
  typeCrud,
  user,
  onSave,

}) => {
  const { t } = useTranslation();
  const { toastRef, setBlocked } = useGlobal();
  const EMPTY_USER: UserFormState = {
    id: 0,
    role_id: 0,
    username: "",
    full_name: "",
    password: "",
    is_enabled: true,
  };

  const [roles, setRoles] = React.useState<RolResponse[]>([]);
  const [formUser, setFormUser] = useState<UserFormState>(EMPTY_USER);

  // Este único useEffect maneja toda la lógica cuando cambia la visibilidad del diálogo.
  // Previene las "condiciones de carrera" y asegura que el formulario se reinicie correctamente.
  useEffect(() => {
    // Se define la función de inicialización dentro del efecto para encapsular la lógica
    // y manejar correctamente las dependencias.
    const initializeForm = async () => {
      if (!visible) {
        // Cuando el diálogo se oculta, reseteamos el estado para evitar mostrar datos antiguos.
        setFormUser(EMPTY_USER);
        setRoles([]);
        return;
      }

      setBlocked(true);
      try {
        // 1. Siempre cargamos los roles primero y esperamos a que se complete.
        // Se usa el patrón try/catch para manejar errores de API de forma consistente.
        const response = await rolService.getAll(); // Asume que rolService.getAll() lanza un error en caso de fallo.
        setRoles(response.result || []);

        // 2. Después de que se cargan los roles, configuramos el estado del formulario para editar o crear.
        if (user && typeCrud === TypesCruds.UPDATE) {
          // Modo Edición: Rellenamos el formulario con los datos del usuario.
          setFormUser({
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            password: "", // La contraseña se deja en blanco por seguridad al editar
            role_id: user.role_id,
            is_enabled: user.is_enabled,
          });
        } else {
          // Modo Creación: Usamos el usuario vacío, limpiando cualquier dato anterior.
          setFormUser(EMPTY_USER);
        }
      } catch (error) {
        // Usamos el manejador centralizado que mostrará el error correcto.
        MessageUtils.handleApiError(toastRef, error, t('actions.loadRoles'));
        setRoles([]); // Limpiar roles en caso de error.
      } finally {
        setBlocked(false);
      }
    };

    initializeForm();
  }, [visible, user, typeCrud, setBlocked, toastRef]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormUser({ ...formUser, [name]: value });
  };

  const handleRoleChange = (e: DropdownChangeEvent) => {
    setFormUser({ ...formUser, role_id: e.value });
  };

  const handleCheckboxChange = (e: CheckboxChangeEvent) => {
    setFormUser({ ...formUser, is_enabled: e.checked ?? false });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSave();
  };

  const validateForm = (): boolean => {
    if (!formUser.full_name.trim()) {
      MessageUtils.showError(toastRef, t(`errorMessages.${ErrorCodes.REQUIRED_NAME}`));
      return false;
    }
    if (!formUser.username.trim()) {
      MessageUtils.showError(toastRef, t(`errorMessages.${ErrorCodes.REQUIRED_EMAIL}`));
      return false;
    }

    // La contraseña solo es obligatoria al crear un usuario nuevo
    if (typeCrud === TypesCruds.CREATE && !formUser.password.trim()) {
      MessageUtils.showError(toastRef, t(`errorMessages.${ErrorCodes.REQUIRED_PASSWORD}`));
      return false;
    }
    if (formUser.role_id == 0) {
      MessageUtils.showError(toastRef, t(`errorMessages.${ErrorCodes.REQUIRED_ROL}`));
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
        const newUser: UserCreate = {
          full_name: formUser.full_name.trim(),
          username: formUser.username.trim(),
          password: formUser.password.trim(),
          role_id: formUser.role_id,
          is_enabled: formUser.is_enabled,
        };
        const response = await userService.create(newUser);
        const successMessage = t(`successMessages.${response.success_code}`, {
          full_name: newUser.full_name,
          defaultValue: response.message,
        });
        MessageUtils.showSuccess(toastRef, successMessage);
        onSave(newUser);
      } else {
        // Al actualizar, solo enviar la contraseña si ha sido modificada.
        const dataToUpdate: UserUpdate = {
          id: formUser.id,
          full_name: formUser.full_name.trim(),
          username: formUser.username.trim(),
          role_id: formUser.role_id,
          is_enabled: formUser.is_enabled,
        };

        const trimmedPassword = formUser.password.trim();
        if (trimmedPassword !== "") {
          dataToUpdate.password = trimmedPassword;
        }

        const response = await userService.update(
          formUser.id,
          dataToUpdate
        );

        const successMessage = t(`successMessages.${response.success_code}`, {
          full_name: dataToUpdate.full_name,
          defaultValue: response.message,
        });
        MessageUtils.showSuccess(toastRef, successMessage);
        onSave(dataToUpdate);
      }
      onHide(); // Cerrar el diálogo en caso de éxito para ambos casos (crear/editar)

    } catch (error) {
      const contextKey = typeCrud === TypesCruds.CREATE ? 'actions.createUser' : 'actions.updateUser';
      MessageUtils.handleApiError(toastRef, error, contextKey);
    } finally {
      setBlocked(false);
    }
  };


  const footer = (
    <div className="flex justify-end gap-2">
      <Button label={t('actions.cancel')} icon="pi pi-times" className="p-button-secondary" onClick={onHide} />
      <Button label={t('actions.save')} icon="pi pi-check" type="submit" form="user-form" />
    </div>
  );

  return (
    <Dialog
      header={t(typeCrud === TypesCruds.CREATE ? 'userCRUD.addTitle' : 'userCRUD.editTitle')}
      visible={visible}
      modal
      onHide={onHide}
      style={{ width: '30rem' }}
      breakpoints={{ '960px': '75vw', '641px': '90vw' }}
      footer={footer}
    >
      <Tooltip target="[data-pr-tooltip]" />
      <form id="user-form" onSubmit={handleSubmit}>
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="full_name">{t('userCRUD.nameLabel')}</label>
            <InputText
              id="full_name"
              name="full_name"
              value={formUser.full_name}
              onChange={handleInputChange}
              autoComplete="name"
              placeholder={t('userCRUD.namePlaceholder')} />
          </div>
          <div className="p-field">
            <label htmlFor="username">{t('userCRUD.emailLabel')}</label>
            <InputText
              id="username"
              name="username" value={formUser.username}
              onChange={handleInputChange} autoComplete="email"
              placeholder={t('userCRUD.emailPlaceholder')} />
          </div>
          <div className="p-field">
            <label htmlFor="password">{t('userCRUD.passwordLabel')}</label>
            <Password
              id="password"
              name="password"
              value={formUser.password}
              onChange={handleInputChange}
              autoComplete="new-password"
              placeholder={t('login.passwordPlaceholder')}
              toggleMask
              feedback={false}
              className="w-full"
              tooltipOptions={{ position: 'right' }}
              pt={{
                // @ts-ignore - La clave 'toggler' es correcta,
                toggler: (options) => ({
                  'data-pr-tooltip': options.state.mask ? t('login.showPasswordTooltip') : t('login.hidePasswordTooltip')
                })
              }}
            />
          </div>
          <div className="p-field">
            <label htmlFor="role_id">{t('userCRUD.roleLabel')}</label>
            <Dropdown
              id="role_id"
              value={formUser.role_id}
              optionValue="id"
              optionLabel="name"
              options={roles}
              onChange={handleRoleChange}
              placeholder={t('userCRUD.rolePlaceholder')}
            />
          </div>
          <div className="p-field flex items-center gap-2 mt-4">
            <Checkbox
              inputId="is_enabled"
              checked={formUser.is_enabled}
              onChange={handleCheckboxChange}
            />
            <label htmlFor="is_enabled">{t('userCRUD.activeLabel')}</label>
          </div>
        </div>
      </form>
    </Dialog>
  );
};

export default UserCRUD;
