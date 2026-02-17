import { motion } from "framer-motion";
import React, { useEffect, useState, useCallback } from "react";
import { userService } from "../services/userService";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog"; // confirmDialog is a function, no need to import the component
import { UserResponse, DialogState } from "../types/user";
import { Tag } from "primereact/tag";
import UserCRUD from "../components/ui/UserCRUD";
import TypesCruds from "../types/constants/TypeCruds";
import { MessageUtils } from "../utils/MessageUtils";
import { useGlobal } from "../context/GlobalContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";


const UserPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { toastRef, setBlocked } = useGlobal();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserResponse[]>([]);
  
  // 1. Mejora: Agrupar estados relacionados en un solo objeto.
  // Esto simplifica la lógica, ya que 'visible', 'type' y 'user' siempre cambian juntos.
  const [dialogState, setDialogState] = useState<DialogState>({
    visible: false, // Estado de visibilidad inicial del diálogo
    type: "",      // Tipo inicial de operación CRUD (por ejemplo, "CREATE", "UPDATE")
    user: null,    // El usuario que se está editando, o nulo para un nuevo usuario
  });

  // 2. Mejora: Usar useCallback para memoizar la función de carga de datos.
  // Evita que se vuelva a crear en cada renderizado a menos que sus dependencias cambien.
  const loadDatas = useCallback(async () => {
    setBlocked(true);
    try {
      const response = await userService.getUsers();
      setUsers(response.result || []);
    } catch (error) {
      // Usamos el manejador centralizado que mostrará el error correcto.
      MessageUtils.handleApiError(toastRef, error, t('actions.loadUsers'));
      setUsers([]); // Limpiar datos en caso de error para evitar mostrar información obsoleta.
    } finally {
      setBlocked(false);
    }
  }, [setBlocked, toastRef, t]); // Dependencias de useCallback

  useEffect(() => {
    loadDatas();
  }, [loadDatas]);

  // 3. Mejora: Funciones específicas y memoizadas para abrir el diálogo en modo 'Crear' o 'Editar'.
  const openNewDialog = useCallback(() => {
    setDialogState({ visible: true, type: TypesCruds.CREATE, user: null });
  }, []);

  const openEditDialog = useCallback((user: UserResponse) => {
    setDialogState({ visible: true, type: TypesCruds.UPDATE, user });
  }, []);

  const hideDialog = useCallback(() => {
    setDialogState({ visible: false, type: "", user: null });
  }, []);

  const handleSave = useCallback(() => {
    loadDatas(); // Recargar los datos es suficiente, UserCRUD se cerrará a sí mismo a través de onHide.
  }, [loadDatas]);

  const acceptDelete = useCallback(async (user: UserResponse) => {
    setBlocked(true);
    try {
      const response = await userService.delete(user.id);
      // Obtenemos el mensaje traducido ANTES de pasarlo a MessageUtils
      const successMessage = t(`successMessages.${response.success_code}`, {
        full_name: user.full_name,
        defaultValue: response.message,
      });
      MessageUtils.showSuccess(toastRef, successMessage);
      loadDatas();
    } catch (error) {
      // El manejador centralizado se encarga de mostrar el mensaje de error adecuado.
      MessageUtils.handleApiError(toastRef, error, 'actions.deleteUser');
    } finally {
      setBlocked(false);
    }
  }, [setBlocked, toastRef, loadDatas, t]);

  const openDeleteDialog = useCallback((user: UserResponse) => {
    confirmDialog({
      message: t('userManagement.deleteConfirmMessage', { full_name: user.full_name }),
      header: t('userManagement.deleteConfirmTitle'),
      icon: "pi pi-exclamation-triangle",
      defaultFocus: "reject",
      acceptClassName: 'p-button-danger',
      accept: () => acceptDelete(user),
    });
  }, [acceptDelete, t]); 
  const actionBodyTemplate = useCallback((rowData: UserResponse) => (
    // Envolvemos los botones en un div con flexbox para un mejor control de la alineación.
    // 'justify-content-end' los alinea a la derecha, lo que funciona bien tanto en vista de tabla como en tarjetas.
    <div className="flex justify-content-end gap-2">
        <Button
            severity="success"
            icon="pi pi-pencil"
            className="p-button-rounded p-button-text"
            tooltip={t('userManagement.editTooltip')}
            tooltipOptions={{ position: "bottom" }}
            onClick={() => openEditDialog(rowData)}
        />
        <Button
            severity="info"
            icon="pi pi-trash"
            className="p-button-rounded p-button-text"
            tooltip={t('userManagement.deleteTooltip')}
            tooltipOptions={{ position: "bottom" }}
            onClick={() => openDeleteDialog(rowData)}
        />
    </div>
  ), [openEditDialog, openDeleteDialog, t]); 

  const statusBodyTemplate = useCallback((rowData: UserResponse) => {
    const severity = rowData.is_enabled ? "success" : "danger";
    const value = rowData.is_enabled ? t('status.active') : t('status.inactive');
    return <Tag severity={severity} value={value}></Tag>;
  }, [t]); 

  const tablesGroupsBodyTemplate = useCallback((rowData: UserResponse) => {
    if (!rowData.tables_groups || rowData.tables_groups.length === 0) {
      return (
        <div>
          <div>{t('common.noTablesGroupsAssigned')}</div>
          <div style={{ marginTop: '8px' }}>
            <Button
              label={t('userManagement.assignTablesGroups')}
              className="p-button-text p-button-sm"
              icon="pi pi-plus"
              onClick={() => navigate(`/tablegroups-user/${rowData.id}`)}
            />
          </div>
        </div>
      );
    }
    
    // Mostrar solo los primeros 3 grupos de tablas
    const displayGroups = rowData.tables_groups.slice(0, 3);
    const hasMoreGroups = rowData.tables_groups.length > 3;
    
    return (
      <div style={{ whiteSpace: 'pre-line' }}>
        {displayGroups.map((group, index) => (
          <div key={index}>
            {group.name}
          </div>
        ))}
        {hasMoreGroups && (
          <div style={{ color: '#6c757d', fontStyle: 'italic' }}>
            ...
          </div>
        )}
        <div style={{ marginTop: '8px' }}>
          <Button
            label={t('userManagement.assignTablesGroups')}
            className="p-button-text p-button-sm"
            icon="pi pi-pencil"
            onClick={() => navigate(`/tablegroups-user/${rowData.id}`)}
          />
        </div>
      </div>
    );
  }, [t, navigate]);

  const updatedAtBodyTemplate = useCallback((rowData: UserResponse) => {
    if (!rowData.updated_at) return t('common.notAvailable');
    return new Date(rowData.updated_at).toLocaleString(i18n.language, {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
  }, [t, i18n.language]); 

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 120 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
      >
        <h1>{t('userManagement.title')}</h1>
      </motion.div>

      <div className="col-12 flex justify-content-end">
        <Button
          label={t('userManagement.newUser')}
          className="button-primary"
          icon="pi pi-plus-circle"
          onClick={openNewDialog}
        ></Button>
      </div>

      <DataTable
        key={i18n.language}
        value={users}
        responsiveLayout="stack"
        breakpoint="768px"
        paginator
        rows={5}
        rowsPerPageOptions={[5, 10, 25, 50, 100]}
        emptyMessage={t('common.noUsersFound')}
      >
        <Column field="full_name" header={t('userCRUD.nameLabel')} sortable />
        <Column field="username" header={t('userCRUD.emailLabel')} sortable />
        <Column field="role_name" header={t('userCRUD.roleLabel')} sortable />
        <Column 
          header={t('environmentCRUD.tablesGroupsLabel')} 
          body={tablesGroupsBodyTemplate}
          style={{ whiteSpace: 'pre-line' }}
        />
        <Column header={t('common.status')} body={statusBodyTemplate} sortable sortField="is_enabled" />
        <Column header={t('common.lastUpdated')} body={updatedAtBodyTemplate} sortable sortField="updated_at" />
        <Column header={t('common.actions')} body={actionBodyTemplate} style={{ minWidth: '8rem' }} />
      </DataTable>

      <UserCRUD
        visible={dialogState.visible}
        onHide={hideDialog}
        typeCrud={dialogState.type}
        user={dialogState.user}
        onSave={handleSave}
      />
    </>
  );
};

export default UserPage;
