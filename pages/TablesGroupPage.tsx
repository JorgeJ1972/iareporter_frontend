import { motion } from "framer-motion";
import React, { useEffect, useState, useCallback } from "react";
import { tablesGroupService } from "../services/tablesGroupService";
import { environmentService } from "../services/environmentService";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";
import { TablesGroupCat, DialogState } from "../types/tableGroupt";
import { EnvironmentResponse } from "../types/environment";
import { Tag } from "primereact/tag";
import TypesCruds from "../types/constants/TypeCruds";
import { MessageUtils } from "../utils/MessageUtils";
import { useGlobal } from "../context/GlobalContext";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import TablesGroupCRUD from "../components/ui/TablesGroupCRUD";

const TablesGroupPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { toastRef, setBlocked } = useGlobal();
  const navigate = useNavigate();
  const { environmentId } = useParams<{ environmentId: string }>();
  const [tablesGroups, setTablesGroups] = useState<TablesGroupCat[]>([]);
  const [environment, setEnvironment] = useState<EnvironmentResponse | null>(null);

  const [dialogState, setDialogState] = useState<DialogState>({
    visible: false,
    type: "",
    tablesGroup: null,
  });

  const loadEnvironment = useCallback(async () => {
    if (!environmentId) return;
    
    try {
      const response = await environmentService.getById(parseInt(environmentId));
      setEnvironment(response.result);
    } catch (error) {
      MessageUtils.handleApiError(toastRef, error, t('actions.loadEnvironment'));
    }
  }, [environmentId, toastRef, t]);

  const loadDatas = useCallback(async () => {
    if (!environmentId) return;
    
    setBlocked(true);
    try {
      const response = await tablesGroupService.getByEnvironmentId(parseInt(environmentId));
      const tablesGroupsData = response.result || [];
      setTablesGroups(tablesGroupsData);
    } catch (error) {
      MessageUtils.handleApiError(toastRef, error, t('actions.loadTablesGroups'));
      setTablesGroups([]);
    } finally {
      setBlocked(false);
    }
  }, [environmentId, setBlocked, toastRef, t]);

  useEffect(() => {
    loadEnvironment();
    loadDatas();
  }, [loadEnvironment, loadDatas]);

  // Recargar cuando cambia el idioma
  useEffect(() => {
    if (tablesGroups.length > 0) {
      loadDatas();
    }
  }, [i18n.language]);

  const openNewDialog = useCallback(() => {
    setDialogState({ visible: true, type: TypesCruds.CREATE, tablesGroup: null });
  }, []);

  const openEditDialog = useCallback((tablesGroup: TablesGroupCat) => {
    setDialogState({ visible: true, type: TypesCruds.UPDATE, tablesGroup });
  }, []);

  const hideDialog = useCallback(() => {
    setDialogState({ visible: false, type: "", tablesGroup: null });
  }, []);

  const handleSave = useCallback(() => {
    loadDatas();
  }, [loadDatas]);

  const acceptDelete = useCallback(async (tablesGroup: TablesGroupCat) => {
    setBlocked(true);
    try {
      const response = await tablesGroupService.delete(tablesGroup.id);
      const successMessage = t(`tablesGroupCRUD.${response.success_code}`, {
        name: tablesGroup.name,
        defaultValue: response.message,
      });
      MessageUtils.showSuccess(toastRef, successMessage);
      loadDatas();
    } catch (error) {
      MessageUtils.handleApiError(toastRef, error, 'actions.deleteTablesGroup');
    } finally {
      setBlocked(false);
    }
  }, [setBlocked, toastRef, loadDatas, t]);

  const openDeleteDialog = useCallback((tablesGroup: TablesGroupCat) => {
    confirmDialog({
      message: t('tablesGroupManagement.deleteConfirmMessage', { name: tablesGroup.name }),
      header: t('tablesGroupManagement.deleteConfirmTitle'),
      icon: "pi pi-exclamation-triangle",
      defaultFocus: "reject",
      acceptClassName: 'p-button-danger',
      accept: () => acceptDelete(tablesGroup),
    });
  }, [acceptDelete, t]);

  const actionBodyTemplate = useCallback((rowData: TablesGroupCat) => (
    <div className="flex justify-content-end gap-2">
      <Button
        severity="info"
        icon="pi pi-cog"
        className="p-button-rounded p-button-text"
        tooltip={t('tablesGroupManagement.configureTooltip')}
        tooltipOptions={{ position: "bottom" }}
        onClick={() => navigate(`/tables-group-config/${rowData.id}`)}
      />
      <Button
        severity="success"
        icon="pi pi-pencil"
        className="p-button-rounded p-button-text"
        tooltip={t('tablesGroupManagement.editTooltip')}
        tooltipOptions={{ position: "bottom" }}
        onClick={() => openEditDialog(rowData)}
      />
      <Button
        severity="info"
        icon="pi pi-trash"
        className="p-button-rounded p-button-text"
        tooltip={t('tablesGroupManagement.deleteTooltip')}
        tooltipOptions={{ position: "bottom" }}
        onClick={() => openDeleteDialog(rowData)}
      />
    </div>
  ), [openEditDialog, openDeleteDialog, navigate, t]);

  const statusBodyTemplate = useCallback((rowData: TablesGroupCat) => {
    const severity = rowData.is_enabled ? "success" : "danger";
    const value = rowData.is_enabled ? t('status.active') : t('status.inactive');
    return <Tag severity={severity} value={value}></Tag>;
  }, [t]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 120 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
      >
        <div className="flex align-items-center gap-3 mb-3">
          <Button
            icon="pi pi-arrow-left"
            className="p-button-text"
            onClick={() => navigate('/environments')}
            tooltip={t('common.back')}
          />
            <h1>{t('tablesGroupManagement.title')}</h1>
        </div>
      </motion.div>

      <div className="col-12 flex justify-content-between align-items-center">
        {environment && (
          <p className="text-500 mt-1 mb-0">
            {t('common.environment')}: <span className="font-semibold">{environment.name}</span>
          </p>
        )}
        <Button
          label={t('tablesGroupManagement.newTablesGroup')}
          className="button-primary"
          icon="pi pi-plus-circle"
          onClick={openNewDialog}
        ></Button>
      </div>

      <DataTable
        key={i18n.language}
        value={tablesGroups}
        responsiveLayout="stack"
        breakpoint="768px"
        paginator
        rows={5}
        rowsPerPageOptions={[5, 10, 25, 50, 100]}
        emptyMessage={t('common.noTablesGroupsFound')}
      >
        <Column field="name" header={t('tablesGroupCRUD.nameLabel')} sortable />
        <Column field="description" header={t('tablesGroupCRUD.descriptionLabel')} sortable />
        <Column header={t('common.status')} body={statusBodyTemplate} sortable sortField="is_enabled" />
        <Column header={t('common.actions')} body={actionBodyTemplate} style={{ minWidth: '8rem' }} />
      </DataTable>

      <TablesGroupCRUD
        visible={dialogState.visible}
        onHide={hideDialog}
        typeCrud={dialogState.type}
        tablesGroup={dialogState.tablesGroup}
        environmentId={parseInt(environmentId || '0')}
        onSave={handleSave}
      />
    </>
  );
};

export default TablesGroupPage;
