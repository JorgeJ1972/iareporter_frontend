import { motion } from "framer-motion";
import React, { useEffect, useState, useCallback } from "react";
import { environmentService } from "../services/environmentService";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";
import { EnvironmentResponse, DialogState } from "../types/environment";
import { Tag } from "primereact/tag";
import TypesCruds from "../types/constants/TypeCruds";
import { MessageUtils } from "../utils/MessageUtils";
import { useGlobal } from "../context/GlobalContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import EnvironmentCRUD from "../components/ui/EnvironmentCRUD";

const EnvironmentPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { toastRef, setBlocked } = useGlobal();
  const navigate = useNavigate();
  const [environments, setEnvironments] = useState<EnvironmentResponse[]>([]);

  const [dialogState, setDialogState] = useState<DialogState>({
    visible: false,
    type: "",
    environment: null,
  });

  const loadDatas = useCallback(async () => {
    setBlocked(true);
    try {
      const response = await environmentService.getEnvironments();
      const environmentsData = response.result || [];
      setEnvironments(environmentsData);
    } catch (error) {
      MessageUtils.handleApiError(toastRef, error, t('actions.loadEnvironments'));
      setEnvironments([]);
    } finally {
      setBlocked(false);
    }
  }, [setBlocked, toastRef, t]);

  useEffect(() => {
    loadDatas();
  }, [loadDatas]);

  // Recargar cuando cambia el idioma
  useEffect(() => {
    if (environments.length > 0) {
      loadDatas();
    }
  }, [i18n.language]);

  const openNewDialog = useCallback(() => {
    setDialogState({ visible: true, type: TypesCruds.CREATE, environment: null });
  }, []);

  const openEditDialog = useCallback((environment: EnvironmentResponse) => {
    setDialogState({ visible: true, type: TypesCruds.UPDATE, environment });
  }, []);

  const hideDialog = useCallback(() => {
    setDialogState({ visible: false, type: "", environment: null });
  }, []);

  const handleSave = useCallback(() => {
    loadDatas();
  }, [loadDatas]);

  const acceptDelete = useCallback(async (environment: EnvironmentResponse) => {
    setBlocked(true);
    try {
      const response = await environmentService.delete(environment.id);
      const successMessage = t(`environmentCRUD.${response.success_code}`, {
        name: environment.name,
        defaultValue: response.message,
      });
      MessageUtils.showSuccess(toastRef, successMessage);
      loadDatas();
    } catch (error) {
      MessageUtils.handleApiError(toastRef, error, 'actions.deleteEnvironment');
    } finally {
      setBlocked(false);
    }
  }, [setBlocked, toastRef, loadDatas, t]);

  const openDeleteDialog = useCallback((environment: EnvironmentResponse) => {
    confirmDialog({
      message: t('environmentManagement.deleteConfirmMessage', { name: environment.name }),
      header: t('environmentManagement.deleteConfirmTitle'),
      icon: "pi pi-exclamation-triangle",
      defaultFocus: "reject",
      acceptClassName: 'p-button-danger',
      accept: () => acceptDelete(environment),
    });
  }, [acceptDelete, t]);

  const actionBodyTemplate = useCallback((rowData: EnvironmentResponse) => (
    <div className="flex justify-content-end gap-2">
      <Button
        severity="info"
        icon="pi pi-cog"
        className="p-button-rounded p-button-text"
        tooltip={t('environmentManagement.configureTooltip')}
        tooltipOptions={{ position: "bottom" }}
        onClick={() => navigate(`/environment-config/${rowData.id}`)}
      />
      <Button
        severity="success"
        icon="pi pi-pencil"
        className="p-button-rounded p-button-text"
        tooltip={t('environmentManagement.editTooltip')}
        tooltipOptions={{ position: "bottom" }}
        onClick={() => openEditDialog(rowData)}
      />
      <Button
        severity="info"
        icon="pi pi-trash"
        className="p-button-rounded p-button-text"
        tooltip={t('environmentManagement.deleteTooltip')}
        tooltipOptions={{ position: "bottom" }}
        onClick={() => openDeleteDialog(rowData)}
      />
    </div>
  ), [openEditDialog, openDeleteDialog, navigate, t]);

  const databaseTypeBodyTemplate = useCallback((rowData: EnvironmentResponse) => {
    const databaseTypeName = rowData.database_type_name || t('common.notAvailable');
    
    // Determinar qué imagen usar según el tipo de base de datos
    const getDatabaseIcon = (typeName: string) => {
      const type = typeName.toLowerCase();
      if (type.includes('sql server')) return '../assets/sql-server-icon.png';
      if (type.includes('mysql')) return '../assets/mysql-icon.png';
      if (type.includes('postgresql')) return '../assets/postgresql-icon.png';
      if (type.includes('oracle')) return '../assets/oracle-icon.png';
      return '../assets/database-icon.png'; // Icono por defecto
    };
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img 
          src={getDatabaseIcon(databaseTypeName)} 
          alt="Database" 
          style={{ width: '26px', height: '26px' }}
        />
        <span>{databaseTypeName}</span>
      </div>
    );
  }, [t]);

  const statusBodyTemplate = useCallback((rowData: EnvironmentResponse) => {
    const severity = rowData.is_enabled ? "success" : "danger";
    const value = rowData.is_enabled ? t('status.active') : t('status.inactive');
    return <Tag severity={severity} value={value}></Tag>;
  }, [t]);

  const tablesGroupsBodyTemplate = useCallback((rowData: EnvironmentResponse) => {
    if (!rowData.tables_groups_names) {
      return (
        <div>
          <div>{t('common.notAvailable')}</div>
          <div style={{ marginTop: '8px' }}>
            <Button
              label={t('environmentManagement.editTablesGroups')}
              className="p-button-text p-button-sm"
              icon="pi pi-pencil"
              onClick={() => navigate(`/tablegroups/${rowData.id}`)}
            />
          </div>
        </div>
      );
    }
    
    // Dividir por comas y crear elementos con saltos de línea
    const tablesGroups = rowData.tables_groups_names.split(', ');
    
    return (
      <div style={{ whiteSpace: 'pre-line' }}>
        {tablesGroups.map((group, index) => (
          <div key={index}>
            {group.trim()}
          </div>
        ))}
        <div style={{ marginTop: '8px' }}>
          <Button
            label={t('environmentManagement.editTablesGroups')}
            className="p-button-text p-button-sm"
            icon="pi pi-pencil"
            onClick={() => navigate(`/tablegroups/${rowData.id}`)}
          />
        </div>
      </div>
    );
  }, [t, navigate]);

  const connectionStringBodyTemplate = useCallback((rowData: EnvironmentResponse) => {
    if (!rowData.connection_string) {
      return t('common.notAvailable');
    }
    return rowData.connection_string.length > 50 
      ? `${rowData.connection_string.substring(0, 50)}...` 
      : rowData.connection_string;
  }, [t]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 120 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
      >
        <h1>{t('environmentManagement.title')}</h1>
      </motion.div>

      <div className="col-12 flex justify-content-end">
        <Button
          label={t('environmentManagement.newEnvironment')}
          className="button-primary"
          icon="pi pi-plus-circle"
          onClick={openNewDialog}
        ></Button>
      </div>

      <DataTable
        key={i18n.language}
        value={environments}
        responsiveLayout="stack"
        breakpoint="768px"
        paginator
        rows={5}
        rowsPerPageOptions={[5, 10, 25, 50, 100]}
        emptyMessage={t('common.noEnvironmentsFound')}
      >
        <Column field="name" header={t('environmentCRUD.nameLabel')} sortable />
        <Column field="description" header={t('environmentCRUD.descriptionLabel')} sortable />
        <Column header={t('environmentCRUD.databaseTypeLabel')} body={databaseTypeBodyTemplate} sortable />
        <Column header={t('environmentCRUD.connectionStringLabel')} body={connectionStringBodyTemplate} />
        <Column 
          header={t('environmentCRUD.tablesGroupsLabel')} 
          body={tablesGroupsBodyTemplate}
          style={{ whiteSpace: 'pre-line' }}
        />
        <Column header={t('common.status')} body={statusBodyTemplate} sortable sortField="is_enabled" />
        <Column header={t('common.actions')} body={actionBodyTemplate} style={{ minWidth: '8rem' }} />
      </DataTable>

      <EnvironmentCRUD
        visible={dialogState.visible}
        onHide={hideDialog}
        typeCrud={dialogState.type}
        environment={dialogState.environment}
        onSave={handleSave}
      />
    </>
  );
};

export default EnvironmentPage;
