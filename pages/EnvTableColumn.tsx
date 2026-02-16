import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ProgressSpinner } from "primereact/progressspinner";
import { ProgressBar } from "primereact/progressbar";
import { Panel } from "primereact/panel";
import { Badge } from "primereact/badge";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { FloatLabel } from "primereact/floatlabel";
import { Chip } from "primereact/chip";
import { confirmDialog } from "primereact/confirmdialog";

import { envTableService } from "../services/envTableService";
import { envTableColumnService } from "../services/envTableColumnService";
import { environmentService } from "../services/environmentService";
import { EnvTableResponse, EnvTableUpdate } from "../types/envTable";
import { EnvTableColumnResponse, EnvTableColumnUpdate } from "../types/envTableColumn";
import { EnvironmentResponse } from "../types/environment";
import { SyncTaskProgress, SyncTaskListResponse } from "../types/syncTask";
import { MessageUtils } from "../utils/MessageUtils";
import { useGlobal } from "../context/GlobalContext";
import { useTranslation } from "react-i18next";

interface TableEditState {
  visible: boolean;
  table: EnvTableResponse | null;
  description: string;
}

interface ColumnEditState {
  visible: boolean;
  column: EnvTableColumnResponse | null;
  description: string;
  synonyms: string[];
  businessName: string;
  businessValues: Record<string, string>;
  newSynonym: string;
  newBusinessKey: string;
  newBusinessValue: string;
}

const EnvTableColumn: React.FC = () => {
  const { t } = useTranslation();
  const { toastRef, setBlocked } = useGlobal();
  const navigate = useNavigate();
  const { environmentId } = useParams<{ environmentId: string }>();
  
  const [loading, setLoading] = useState(true);
  const [environment, setEnvironment] = useState<EnvironmentResponse | null>(null);
  const [tables, setTables] = useState<EnvTableResponse[]>([]);
  const [expandedRows, setExpandedRows] = useState<any>({});

  // Estados para edición de tabla
  const [tableEditState, setTableEditState] = useState<TableEditState>({
    visible: false,
    table: null,
    description: ""
  });

  // Estados para edición de columna
  const [columnEditState, setColumnEditState] = useState<ColumnEditState>({
    visible: false,
    column: null,
    description: "",
    synonyms: [],
    businessName: "",
    businessValues: {},
    newSynonym: "",
    newBusinessKey: "",
    newBusinessValue: ""
  });

  // Estados para sincronización en segundo plano
  const [syncTask, setSyncTask] = useState<SyncTaskProgress | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncProgress, setShowSyncProgress] = useState(false);

  // Estados para el diálogo de tareas de sincronización
  const [syncTasksDialogVisible, setSyncTasksDialogVisible] = useState(false);
  const [syncTasks, setSyncTasks] = useState<SyncTaskProgress[]>([]);
  const [loadingSyncTasks, setLoadingSyncTasks] = useState(false);

  // Cargar datos iniciales
  const loadData = useCallback(async () => {
    if (!environmentId) return;
    
    setLoading(true);
    setBlocked(true);
    try {
      // Cargar datos del environment
      const environmentResponse = await environmentService.getById(parseInt(environmentId));
      if (environmentResponse.result) {
        setEnvironment(environmentResponse.result);
      }

      // Cargar tablas con sus columnas
      const tablesResponse = await envTableService.getByEnvironmentId(parseInt(environmentId));
      const tablesData = tablesResponse.result || [];
      setTables(tablesData);
      
    } catch (error) {
      MessageUtils.handleApiError(toastRef, error, t('actions.loadData'));
    } finally {
      setLoading(false);
      setBlocked(false);
    }
  }, [environmentId, toastRef, t, setBlocked]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Funciones para editar tabla
  const openTableEditDialog = useCallback((table: EnvTableResponse) => {
    setTableEditState({
      visible: true,
      table,
      description: table.description || ""
    });
  }, []);

  const closeTableEditDialog = useCallback(() => {
    setTableEditState({
      visible: false,
      table: null,
      description: ""
    });
  }, []);

  const saveTableChanges = useCallback(async () => {
    if (!tableEditState.table) return;
    
    setBlocked(true);
    try {
      const updateData: EnvTableUpdate = {
        description: tableEditState.description || null
      };
      
      await envTableService.update(tableEditState.table.id, updateData);
      MessageUtils.showSuccess(toastRef, t('common.savedSuccessfully'));
      closeTableEditDialog();
      loadData(); // Recargar datos
    } catch (error) {
      MessageUtils.handleApiError(toastRef, error, t('actions.save'));
    } finally {
      setBlocked(false);
    }
  }, [tableEditState, toastRef, t, setBlocked, loadData]);

  const confirmCancelTableChanges = useCallback(() => {
    if (tableEditState.description !== (tableEditState.table?.description || "")) {
      confirmDialog({
        message: t('common.unsavedChangesMessage'),
        header: t('common.confirmAction'),
        icon: "pi pi-exclamation-triangle",
        accept: closeTableEditDialog
      });
    } else {
      closeTableEditDialog();
    }
  }, [tableEditState, t]);

  // Funciones para editar columna
  const openColumnEditDialog = useCallback((column: EnvTableColumnResponse) => {
    const synonyms = column.synonyms ? JSON.parse(column.synonyms) : [];
    const businessValues = column.business_values ? JSON.parse(column.business_values) : {};
    
    setColumnEditState({
      visible: true,
      column,
      description: column.description || "",
      synonyms,
      businessName: column.business_name || "",
      businessValues,
      newSynonym: "",
      newBusinessKey: "",
      newBusinessValue: ""
    });
  }, []);

  const closeColumnEditDialog = useCallback(() => {
    setColumnEditState({
      visible: false,
      column: null,
      description: "",
      synonyms: [],
      businessName: "",
      businessValues: {},
      newSynonym: "",
      newBusinessKey: "",
      newBusinessValue: ""
    });
  }, []);

  // Funciones para manejar sinónimos
  const addSynonym = useCallback(() => {
    if (columnEditState.newSynonym.trim() && !columnEditState.synonyms.includes(columnEditState.newSynonym.trim())) {
      setColumnEditState(prev => ({
        ...prev,
        synonyms: [...prev.synonyms, prev.newSynonym.trim()],
        newSynonym: ""
      }));
    }
  }, [columnEditState.newSynonym, columnEditState.synonyms]);

  const removeSynonym = useCallback((index: number) => {
    setColumnEditState(prev => ({
      ...prev,
      synonyms: prev.synonyms.filter((_, i) => i !== index)
    }));
  }, []);

  // Funciones para manejar business values
  const addBusinessValue = useCallback(() => {
    if (columnEditState.newBusinessKey.trim() && columnEditState.newBusinessValue.trim()) {
      setColumnEditState(prev => ({
        ...prev,
        businessValues: {
          ...prev.businessValues,
          [prev.newBusinessKey.trim()]: prev.newBusinessValue.trim()
        },
        newBusinessKey: "",
        newBusinessValue: ""
      }));
    }
  }, [columnEditState.newBusinessKey, columnEditState.newBusinessValue]);

  const removeBusinessValue = useCallback((key: string) => {
    setColumnEditState(prev => {
      const newBusinessValues = { ...prev.businessValues };
      delete newBusinessValues[key];
      return {
        ...prev,
        businessValues: newBusinessValues
      };
    });
  }, []);

  const saveColumnChanges = useCallback(async () => {
    if (!columnEditState.column) return;
    
    setBlocked(true);
    try {
      const updateData: EnvTableColumnUpdate = {
        description: columnEditState.description || null,
        synonyms: columnEditState.synonyms.length > 0 ? JSON.stringify(columnEditState.synonyms) : null,
        business_name: columnEditState.businessName || null,
        business_values: Object.keys(columnEditState.businessValues).length > 0 
          ? JSON.stringify(columnEditState.businessValues) : null
      };
      
      await envTableColumnService.update(columnEditState.column.id, updateData);
      MessageUtils.showSuccess(toastRef, t('common.savedSuccessfully'));
      closeColumnEditDialog();
      loadData(); // Recargar datos
    } catch (error) {
      MessageUtils.handleApiError(toastRef, error, t('actions.save'));
    } finally {
      setBlocked(false);
    }
  }, [columnEditState, toastRef, t, setBlocked, loadData]);

  // Sincronizar tablas y columnas en segundo plano
  const syncPromptSystem = useCallback(async () => {
    if (!environmentId) return;

    confirmDialog({
      message: t('environmentTablesPage.syncConfirm'),
      header: t('environmentTablesPage.synchronize'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: t('common.yes'),
      rejectLabel: t('common.no'),
      accept: async () => {
        await handleBackgroundSync();
      }
    });
  }, [environmentId, t]);

  const handleBackgroundSync = useCallback(async () => {
    if (!environmentId || isSyncing) return;

    try {
      setIsSyncing(true);
      setShowSyncProgress(true);
      setSyncProgress(0);

      // Iniciar sincronización en segundo plano
      const response = await envTableService.startBackgroundSync(parseInt(environmentId));

      if (response.status === 'started' && response.task_id) {
        const taskId = response.task_id;
        
        // Iniciar polling del progreso
        pollSyncProgress(taskId);
      } else {
        MessageUtils.showError(toastRef, response.message || t('environmentTablesPage.syncError'));
        setIsSyncing(false);
        setShowSyncProgress(false);
      }
    } catch (error) {
      MessageUtils.handleApiError(toastRef, error, t('environmentTablesPage.syncError'));
      setIsSyncing(false);
      setShowSyncProgress(false);
    }
  }, [environmentId, isSyncing, toastRef, t]);

  const pollSyncProgress = useCallback((taskId: number) => {
    const interval = setInterval(async () => {
      try {
        const response = await envTableService.getSyncTaskStatus(taskId);
        
        if (response.task) {
          const task = response.task;
          setSyncTask(task);
          setSyncProgress(task.progress_percent);

          if (task.status === 'completed') {
            clearInterval(interval);
            setIsSyncing(false);
            setShowSyncProgress(false);
            MessageUtils.showSuccess(toastRef, t('environmentTablesPage.syncSuccess'));
            
            // Recargar datos después de sincronización exitosa
            await loadData();
          } else if (task.status === 'failed') {
            clearInterval(interval);
            setIsSyncing(false);
            setShowSyncProgress(false);
            MessageUtils.showError(toastRef, task.error_message || t('environmentTablesPage.syncError'));
          }
        }
      } catch (error) {
        clearInterval(interval);
        setIsSyncing(false);
        setShowSyncProgress(false);
        MessageUtils.handleApiError(toastRef, error, t('environmentTablesPage.syncError'));
      }
    }, 2000); // Poll cada 2 segundos
  }, [toastRef, t, loadData]);

  // Función para cargar las tareas de sincronización
  const loadSyncTasks = useCallback(async () => {
    if (!environmentId) return;

    setLoadingSyncTasks(true);
    try {
      const response = await envTableService.getSyncTasksByEnvironment(parseInt(environmentId));
      setSyncTasks(response.tasks);
    } catch (error) {
      MessageUtils.handleApiError(toastRef, error, 'Error al cargar tareas de sincronización');
    } finally {
      setLoadingSyncTasks(false);
    }
  }, [environmentId, toastRef]);

  // Función para abrir el diálogo de tareas de sincronización
  const openSyncTasksDialog = useCallback(() => {
    setSyncTasksDialogVisible(true);
    loadSyncTasks();
  }, [loadSyncTasks]);

  const confirmCancelColumnChanges = useCallback(() => {
    const originalColumn = columnEditState.column;
    const originalSynonyms = originalColumn?.synonyms ? JSON.parse(originalColumn.synonyms) : [];
    const originalBusinessValues = originalColumn?.business_values ? JSON.parse(originalColumn.business_values) : {};
    
    const hasChanges = 
      columnEditState.description !== (originalColumn?.description || "") ||
      JSON.stringify(columnEditState.synonyms) !== JSON.stringify(originalSynonyms) ||
      columnEditState.businessName !== (originalColumn?.business_name || "") ||
      JSON.stringify(columnEditState.businessValues) !== JSON.stringify(originalBusinessValues);
    
    if (hasChanges) {
      confirmDialog({
        message: t('common.unsavedChangesMessage'),
        header: t('common.confirmAction'),
        icon: "pi pi-exclamation-triangle",
        accept: closeColumnEditDialog
      });
    } else {
      closeColumnEditDialog();
    }
  }, [columnEditState, t]);

  // Templates para la tabla
  const tableActionsTemplate = useCallback((rowData: EnvTableResponse) => (
    <Button
      icon="pi pi-pencil"
      className="p-button-text p-button-sm"
      tooltip={t('common.editDescription')}
      onClick={() => openTableEditDialog(rowData)}
    />
  ), [openTableEditDialog, t]);

  const columnsExpandTemplate = useCallback((rowData: EnvTableResponse) => {
    if (!rowData.columns || rowData.columns.length === 0) {
      return <div className="p-3">{t('common.noColumnsFound')}</div>;
    }

    const columnActionTemplate = (column: EnvTableColumnResponse) => (
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-button-sm"
        tooltip={t('common.editProperties')}
        onClick={() => openColumnEditDialog(column)}
      />
    );

    const columnTypeTemplate = (column: EnvTableColumnResponse) => {
      const badges = [];
      if (column.is_pk) badges.push(<Badge key="pk" value="PK" severity="success" className="mr-1" />);
      if (column.fk_info) badges.push(<Badge key="fk" value="FK" severity="info" className="mr-1" />);
      if (!column.is_null) badges.push(<Badge key="nn" value="NN" severity="warning" className="mr-1" />);
      return (
        <div>
          <div>{column.data_type}</div>
          <div className="mt-1">{badges}</div>
        </div>
      );
    };

    return (
      <div className="p-3">
        <DataTable 
          value={rowData.columns} 
          size="small"
          className="p-datatable-sm"
          showGridlines
        >
          <Column field="name" header={t('column.name')} style={{ width: '25%' }} />
          <Column field="data_type" header={t('column.type')} body={columnTypeTemplate} style={{ width: '15%' }} />
          <Column field="description" header={t('column.description')} style={{ width: '30%' }} />
          <Column field="business_name" header={t('column.businessName')} style={{ width: '20%' }} />
          <Column header={t('common.actions')} body={columnActionTemplate} style={{ width: '10%' }} />
        </DataTable>
      </div>
    );
  }, [openColumnEditDialog, t]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-column">
      <motion.div
        initial={{ opacity: 0, x: 120 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
      >
        <div className="flex align-items-center justify-content-between mb-3">
          <div className="flex align-items-center gap-3">
            <Button
              icon="pi pi-arrow-left"
              className="p-button-text"
              onClick={() => navigate('/environments')}
              tooltip={t('common.back')}
            />
            <h1>{t('environmentConfig.title')} - {environment?.name}</h1>
          </div>
          <div className="flex gap-2">
            <Button
              label={t('environmentTablesPage.synchronize')}
              className="p-button-outlined p-button-info"
              icon={isSyncing ? "pi pi-spin pi-spinner" : "pi pi-sync"}
              onClick={syncPromptSystem}
              disabled={isSyncing}
              tooltip={t('environmentTablesPage.synchronizeTooltip')}
              tooltipOptions={{ position: "bottom" }}
            />
            <Button
              label={t('environmentTablesPage.syncHistory')}
              className="p-button-outlined p-button-secondary"
              icon="pi pi-history"
              onClick={openSyncTasksDialog}
              tooltip={t('environmentTablesPage.syncHistoryTooltip')}
              tooltipOptions={{ position: "bottom" }}
            />
          </div>
        </div>
      </motion.div>

      <div className="flex-1">
        <DataTable
          value={tables}
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={columnsExpandTemplate}
          dataKey="id"
          className="p-datatable-sm"
          emptyMessage={t('common.noTablesFound')}
        >
          <Column expander style={{ width: '5%' }} />
          <Column field="name" header={t('table.name')} style={{ width: '25%' }} />
          <Column field="description" header={t('table.description')} style={{ width: '40%' }} />
          <Column field="table_type" header={t('table.type')} style={{ width: '10%' }} />
          <Column 
            header={t('table.columnCount')} 
            body={(rowData) => <Badge value={rowData.columns?.length || 0} />} 
            style={{ width: '10%' }} 
          />
          <Column header={t('common.actions')} body={tableActionsTemplate} style={{ width: '10%' }} />
        </DataTable>
      </div>

      {/* Dialog para editar tabla */}
      <Dialog
        header={t('table.editDescription')}
        visible={tableEditState.visible}
        style={{ width: '500px' }}
        onHide={confirmCancelTableChanges}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label={t('common.cancel')}
              icon="pi pi-times"
              className="p-button-text"
              onClick={confirmCancelTableChanges}
            />
            <Button
              label={t('common.save')}
              icon="pi pi-check"
              onClick={saveTableChanges}
            />
          </div>
        }
      >
        <div className="grid">
          <div className="col-12">
            <FloatLabel>
              <InputText 
                id="tableName"
                value={tableEditState.table?.name || ""}
                disabled
                className="w-full"
              />
              <label htmlFor="tableName">{t('table.name')}</label>
            </FloatLabel>
          </div>
          <div className="col-12 mt-3">
            <FloatLabel>
              <InputTextarea
                id="tableDescription"
                value={tableEditState.description}
                onChange={(e) => setTableEditState(prev => ({...prev, description: e.target.value}))}
                rows={3}
                className="w-full"
              />
              <label htmlFor="tableDescription">{t('table.description')}</label>
            </FloatLabel>
          </div>
        </div>
      </Dialog>

      {/* Dialog para editar columna */}
      <Dialog
        header={t('column.editProperties')}
        visible={columnEditState.visible}
        style={{ width: '800px', height: '90vh' }}
        maximizable
        onHide={confirmCancelColumnChanges}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label={t('common.cancel')}
              icon="pi pi-times"
              className="p-button-text"
              onClick={confirmCancelColumnChanges}
            />
            <Button
              label={t('common.save')}
              icon="pi pi-check"
              onClick={saveColumnChanges}
            />
          </div>
        }
      >
        <div className="grid">
          {/* Información básica de la columna (solo lectura) */}
          <div className="col-12">
            <Panel header={t('column.basicInfo')} className="mb-3">
              <div className="grid">
                <div className="col-6">
                  <FloatLabel>
                    <InputText 
                      id="columnName"
                      value={columnEditState.column?.name || ""}
                      disabled
                      className="w-full"
                    />
                    <label htmlFor="columnName">{t('column.name')}</label>
                  </FloatLabel>
                </div>
                <div className="col-6">
                  <FloatLabel>
                    <InputText 
                      id="columnDataType"
                      value={columnEditState.column?.data_type || ""}
                      disabled
                      className="w-full"
                    />
                    <label htmlFor="columnDataType">{t('column.dataType')}</label>
                  </FloatLabel>
                </div>
                <div className="col-6 mt-3">
                  <div className="flex gap-2">
                    {columnEditState.column?.is_pk && <Badge value="Primary Key" severity="success" />}
                    {columnEditState.column?.fk_info && <Badge value="Foreign Key" severity="info" />}
                    {columnEditState.column?.is_null === false && <Badge value="Not Null" severity="warning" />}
                  </div>
                </div>
              </div>
            </Panel>
          </div>

          {/* Descripción */}
          <div className="col-12">
            <Panel header={t('column.description')} className="mb-3">
              <FloatLabel>
                <InputTextarea
                  id="columnDescription"
                  value={columnEditState.description}
                  onChange={(e) => setColumnEditState(prev => ({...prev, description: e.target.value}))}
                  rows={3}
                  className="w-full"
                />
                <label htmlFor="columnDescription">{t('column.description')}</label>
              </FloatLabel>
            </Panel>
          </div>

          {/* Business Name */}
          <div className="col-12">
            <Panel header={t('column.businessName')} className="mb-3">
              <FloatLabel>
                <InputText
                  id="businessName"
                  value={columnEditState.businessName}
                  onChange={(e) => setColumnEditState(prev => ({...prev, businessName: e.target.value}))}
                  className="w-full"
                />
                <label htmlFor="businessName">{t('column.businessName')}</label>
              </FloatLabel>
            </Panel>
          </div>

          {/* Sinónimos */}
          <div className="col-12">
            <Panel header={t('column.synonyms')} className="mb-3">
              <div className="mb-3">
                <div className="flex">
                  <InputText
                    placeholder={t('column.addSynonym')}
                    value={columnEditState.newSynonym}
                    onChange={(e) => setColumnEditState(prev => ({...prev, newSynonym: e.target.value}))}
                    onKeyDown={(e) => e.key === 'Enter' && addSynonym()}
                    className="flex-1"
                  />
                  <Button 
                    icon="pi pi-plus" 
                    onClick={addSynonym}
                    disabled={!columnEditState.newSynonym.trim()}
                    className="ml-2"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {columnEditState.synonyms.map((synonym, index) => (
                  <Chip
                    key={index}
                    label={synonym}
                    removable
                    onRemove={() => {
                      removeSynonym(index);
                      return true;
                    }}
                  />
                ))}
              </div>
            </Panel>
          </div>

          {/* Business Values */}
          <div className="col-12">
            <Panel header={t('column.businessValues')} className="mb-3">
              <div className="mb-3">
                <div className="grid">
                  <div className="col-5">
                    <InputText
                      placeholder={t('column.key')}
                      value={columnEditState.newBusinessKey}
                      onChange={(e) => setColumnEditState(prev => ({...prev, newBusinessKey: e.target.value}))}
                      className="w-full"
                    />
                  </div>
                  <div className="col-5">
                    <InputText
                      placeholder={t('column.value')}
                      value={columnEditState.newBusinessValue}
                      onChange={(e) => setColumnEditState(prev => ({...prev, newBusinessValue: e.target.value}))}
                      onKeyDown={(e) => e.key === 'Enter' && addBusinessValue()}
                      className="w-full"
                    />
                  </div>
                  <div className="col-2">
                    <Button 
                      icon="pi pi-plus" 
                      onClick={addBusinessValue}
                      disabled={!columnEditState.newBusinessKey.trim() || !columnEditState.newBusinessValue.trim()}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              <div>
                {Object.entries(columnEditState.businessValues).map(([key, value]) => (
                  <div key={key} className="flex justify-content-between align-items-center p-2 border-1 surface-border border-round mb-2">
                    <span><strong>{key}:</strong> {value}</span>
                    <Button
                      icon="pi pi-times"
                      className="p-button-text p-button-sm"
                      onClick={() => removeBusinessValue(key)}
                    />
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </Dialog>

      {/* Dialog para mostrar progreso de sincronización */}
      <Dialog
        header={t('environmentTablesPage.syncProgress')}
        visible={showSyncProgress}
        onHide={() => {}}
        closable={false}
        style={{ width: '400px' }}
        modal
      >
        <div className="flex flex-column gap-3">
          <div className="flex align-items-center gap-2">
            <ProgressSpinner style={{ width: '30px', height: '30px' }} />
            <span>{t('environmentTablesPage.syncInProgress')}</span>
          </div>
          
          <ProgressBar value={syncProgress} />
          
          <div className="text-sm text-600">
            <div><strong>{t('common.progress')}:</strong> {syncProgress.toFixed(1)}%</div>
            {syncTask && (
              <div><strong>{t('common.currentStep')}:</strong> {syncTask.current_step}</div>
            )}
          </div>
        </div>
      </Dialog>

      {/* Dialog para mostrar historial de sincronizaciones */}
      <Dialog
        header={t('environmentTablesPage.syncHistoryTitle')}
        visible={syncTasksDialogVisible}
        onHide={() => setSyncTasksDialogVisible(false)}
        style={{ width: '90vw', maxWidth: '1000px' }}
        modal
      >
        {loadingSyncTasks ? (
          <div className="flex justify-content-center p-4">
            <ProgressSpinner />
          </div>
        ) : (
          <DataTable
            value={syncTasks}
            className="p-datatable-sm"
            emptyMessage={t('environmentTablesPage.noSyncTasks')}
            paginator
            rows={10}
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} tareas"
          >
            <Column 
              field="task_id" 
              header={t('environmentTablesPage.taskId')} 
              style={{ width: '8%' }}
              body={(rowData) => <Badge value={rowData.task_id} />}
            />
            <Column 
              field="status" 
              header={t('environmentTablesPage.status')} 
              style={{ width: '12%' }}
              body={(rowData) => {
                const getSeverity = (status: string) => {
                  switch (status) {
                    case 'completed': return 'success';
                    case 'failed': return 'danger';
                    case 'running': return 'warning';
                    default: return 'info';
                  }
                };
                return <Badge value={rowData.status} severity={getSeverity(rowData.status)} />;
              }}
            />
            <Column 
              field="progress_percent" 
              header={t('environmentTablesPage.progress')} 
              style={{ width: '12%' }}
              body={(rowData) => `${rowData.progress_percent.toFixed(1)}%`}
            />
            <Column 
              field="created_at" 
              header={t('environmentTablesPage.startTime')} 
              style={{ width: '15%' }}
              body={(rowData) => new Date(rowData.created_at).toLocaleString()}
            />
            <Column 
              field="completed_at" 
              header={t('environmentTablesPage.endTime')} 
              style={{ width: '15%' }}
              body={(rowData) => rowData.completed_at ? new Date(rowData.completed_at).toLocaleString() : '-'}
            />
            <Column 
              header={t('environmentTablesPage.duration')} 
              style={{ width: '10%' }}
              body={(rowData) => {
                if (!rowData.started_at) return '-';
                const startTime = new Date(rowData.started_at);
                const endTime = rowData.completed_at ? new Date(rowData.completed_at) : new Date();
                const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
                return `${duration}s`;
              }}
            />
            <Column 
              header={t('environmentTablesPage.results')} 
              style={{ width: '28%' }}
              body={(rowData) => (
                <div className="text-sm">
                  <div>Tablas: {rowData.tables_created}+ / {rowData.tables_updated}↻</div>
                  <div>Columnas: {rowData.columns_created}+ / {rowData.columns_updated}↻</div>
                  {rowData.error_message && (
                    <div className="text-red-500 mt-1" title={rowData.error_message}>
                      Error: {rowData.error_message.length > 50 ? 
                        `${rowData.error_message.substring(0, 50)}...` : 
                        rowData.error_message
                      }
                    </div>
                  )}
                </div>
              )}
            />
          </DataTable>
        )}
      </Dialog>
    </div>
  );
};

export default EnvTableColumn;