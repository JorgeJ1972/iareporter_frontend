import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ProgressSpinner } from "primereact/progressspinner";
import { Checkbox } from "primereact/checkbox";
import { Badge } from "primereact/badge";
import { confirmDialog } from "primereact/confirmdialog";
import { Panel } from "primereact/panel";

import { tablesGroupService } from "../services/tablesGroupService";
import { envTableService } from "../services/envTableService";
import { tgroupEnvTableService } from "../services/tgroupEnvTableService";
import { tgroupEnvTColumnService } from "../services/tgroupEnvTColumnService";
import { envTableColumnService } from "../services/envTableColumnService";

import { EnvTableResponse } from "../types/envTable";
import { EnvTableColumnResponse } from "../types/envTableColumn";
import { TablesGroupCat } from "../types/tableGroupt";
import { TGroupEnvTableResponse, TGroupEnvTableCreate } from "../types/tgroupEnvTable";
import { TGroupEnvTColumnResponse, TGroupEnvTColumnCreate } from "../types/tgroupEnvTColumn";

import { MessageUtils } from "../utils/MessageUtils";
import { useGlobal } from "../context/GlobalContext";
import { useTranslation } from "react-i18next";

interface TableWithColumns extends EnvTableResponse {
  columns: EnvTableColumnResponse[];
}

interface TableSelectionState {
  tableId: number;
  isSelected: boolean;
  selectedColumns: number[]; // IDs de columnas seleccionadas
}

const TablesGroupTableColumn: React.FC = () => {
  const { t } = useTranslation();
  const { toastRef, setBlocked } = useGlobal();
  const navigate = useNavigate();
  const { tablesGroupId } = useParams<{ tablesGroupId: string }>();
  
  const [loading, setLoading] = useState(true);
  const [tablesGroup, setTablesGroup] = useState<TablesGroupCat | null>(null);
  const [tables, setTables] = useState<TableWithColumns[]>([]);
  const [expandedRows, setExpandedRows] = useState<any>({});
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Estados para las selecciones
  const [tableSelections, setTableSelections] = useState<TableSelectionState[]>([]);
  const [originalSelections, setOriginalSelections] = useState<TableSelectionState[]>([]);
  
  // Estados para los datos del backend
  const [assignedTables, setAssignedTables] = useState<TGroupEnvTableResponse[]>([]);
  const [assignedColumns, setAssignedColumns] = useState<TGroupEnvTColumnResponse[]>([]);
  
  // Estados para sincronización
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Cargar datos iniciales
  const loadData = useCallback(async () => {
    if (!tablesGroupId) return;
    
    setLoading(true);
    setBlocked(true);
    
    try {
      const groupId = parseInt(tablesGroupId);
      
      // Cargar información del grupo de tablas
      const groupResponse = await tablesGroupService.getByTablesGroupId(groupId);
      if (groupResponse.result) {
        setTablesGroup(groupResponse.result);
        
        // Cargar todas las tablas del ambiente
        const tablesResponse = await envTableService.getByEnvironmentId(groupResponse.result.environment_id);
        const tablesData = tablesResponse.result || [];
        
        // Cargar columnas para cada tabla
        const tablesWithColumns: TableWithColumns[] = await Promise.all(
          tablesData.map(async (table) => {
            try {
              const columnsResponse = await envTableColumnService.getByEnvTableId(table.id);
              return {
                ...table,
                columns: columnsResponse.result || []
              };
            } catch (error) {
              console.warn(`Error loading columns for table ${table.id}:`, error);
              return {
                ...table,
                columns: []
              };
            }
          })
        );
        
        setTables(tablesWithColumns);
        
        // Cargar asignaciones existentes
        const assignedTablesResponse = await tgroupEnvTableService.getByTablesGroupId(groupId);
        const assignedTablesData = assignedTablesResponse.result || [];
        setAssignedTables(assignedTablesData);
        
        const assignedColumnsResponse = await tgroupEnvTColumnService.getByTablesGroupId(groupId);
        const assignedColumnsData = assignedColumnsResponse.result || [];
        setAssignedColumns(assignedColumnsData);
        
        // Generar estados de selección basados en las asignaciones existentes
        const selections: TableSelectionState[] = tablesWithColumns.map(table => {
          const isTableAssigned = assignedTablesData.some(at => at.envtable_id === table.id);
          const selectedColumns = assignedColumnsData
            .filter(ac => {
              // Verificar si la columna pertenece a esta tabla
              return table.columns.some(col => col.id === ac.envtablecol_id);
            })
            .map(ac => ac.envtablecol_id);
            
          return {
            tableId: table.id,
            isSelected: isTableAssigned,
            selectedColumns: selectedColumns
          };
        });
        
        setTableSelections(selections);
        setOriginalSelections(JSON.parse(JSON.stringify(selections))); // Deep copy
      }
      
    } catch (error) {
      MessageUtils.handleApiError(toastRef, error, t('actions.loadData'));
    } finally {
      setLoading(false);
      setBlocked(false);
    }
  }, [tablesGroupId, toastRef, t, setBlocked]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Manejar selección de tabla
  const handleTableSelection = useCallback((tableId: number, isChecked: boolean) => {
    setTableSelections(prev => 
      prev.map(selection => {
        if (selection.tableId === tableId) {
          // Si se selecciona la tabla, seleccionar todas sus columnas por defecto
          // Si se deselecciona la tabla, deseleccionar todas sus columnas
          const table = tables.find(t => t.id === tableId);
          const allColumnIds = table?.columns?.map(col => col.id) || [];
          
          return {
            ...selection,
            isSelected: isChecked,
            selectedColumns: isChecked ? allColumnIds : []
          };
        }
        return selection;
      })
    );
    // Forzar re-render
    setRefreshKey(prev => prev + 1);
  }, [tables]);

  // Manejar selección de columna
  const handleColumnSelection = useCallback((tableId: number, columnId: number, isChecked: boolean) => {
    setTableSelections(prev => 
      prev.map(selection => {
        if (selection.tableId === tableId) {
          const newSelectedColumns = isChecked
            ? [...selection.selectedColumns, columnId]
            : selection.selectedColumns.filter(id => id !== columnId);
          
          // Si no hay columnas seleccionadas, deseleccionar la tabla también
          // Si hay al menos una columna seleccionada, seleccionar la tabla automáticamente
          const shouldTableBeSelected = newSelectedColumns.length > 0;
          
          return {
            ...selection,
            isSelected: shouldTableBeSelected,
            selectedColumns: newSelectedColumns
          };
        }
        return selection;
      })
    );
    // Forzar re-render
    setRefreshKey(prev => prev + 1);
  }, []);

  // Verificar si hay cambios
  const hasChanges = useCallback(() => {
    return JSON.stringify(tableSelections) !== JSON.stringify(originalSelections);
  }, [tableSelections, originalSelections]);

  // Guardar cambios
  const saveChanges = useCallback(async () => {
    if (!tablesGroupId) return;
    
    setBlocked(true);
    try {
      const groupId = parseInt(tablesGroupId);
      
      // Comparar selecciones actuales vs originales para determinar cambios
      const tablesToAdd: number[] = [];
      const tablesToRemove: number[] = [];
      const columnsToAdd: { envtablecol_id: number }[] = [];
      const columnsToRemove: number[] = [];
      
      tableSelections.forEach((current, index) => {
        const original = originalSelections[index];
        
        // Cambios en tablas
        if (current.isSelected !== original.isSelected) {
          if (current.isSelected) {
            tablesToAdd.push(current.tableId);
          } else {
            tablesToRemove.push(current.tableId);
          }
        }
        
        // Cambios en columnas
        const addedColumns = current.selectedColumns.filter(colId => !original.selectedColumns.includes(colId));
        const removedColumns = original.selectedColumns.filter(colId => !current.selectedColumns.includes(colId));
        
        addedColumns.forEach(colId => {
          columnsToAdd.push({ envtablecol_id: colId });
        });
        
        removedColumns.forEach(colId => {
          // Buscar el ID del registro TGroupEnvTColumn para eliminar
          const assignedColumn = assignedColumns.find(ac => ac.envtablecol_id === colId);
          if (assignedColumn) {
            columnsToRemove.push(assignedColumn.id);
          }
        });
      });
      
      // Ejecutar operaciones de eliminación primero
      for (const tableId of tablesToRemove) {
        const assignedTable = assignedTables.find(at => at.envtable_id === tableId);
        if (assignedTable) {
          await tgroupEnvTableService.delete(assignedTable.id);
        }
      }
      
      for (const columnRecordId of columnsToRemove) {
        await tgroupEnvTColumnService.delete(columnRecordId);
      }
      
      // Ejecutar operaciones de adición
      for (const tableId of tablesToAdd) {
        const createData: TGroupEnvTableCreate = {
          tables_group_id: groupId,
          envtable_id: tableId
        };
        await tgroupEnvTableService.create(createData);
      }
      
      for (const columnData of columnsToAdd) {
        const createData: TGroupEnvTColumnCreate = {
          tables_group_id: groupId,
          envtablecol_id: columnData.envtablecol_id
        };
        await tgroupEnvTColumnService.create(createData);
      }
      
      // Actualizar prompt_system ejecutando el stored procedure
      try {
        await tablesGroupService.updatePromptSystem(groupId);
        MessageUtils.showSuccess(toastRef, t('tablesGroupConfig.promptSystemUpdated'));
      } catch (promptError) {
        console.warn('Warning: Could not update prompt system:', promptError);
        // No lanzamos error porque las tablas se guardaron correctamente
      }
      
      MessageUtils.showSuccess(toastRef, t('common.savedSuccessfully'));
      
      // Recargar datos para actualizar el estado
      await loadData();
      
    } catch (error) {
      MessageUtils.handleApiError(toastRef, error, t('actions.save'));
    } finally {
      setBlocked(false);
    }
  }, [tablesGroupId, tableSelections, originalSelections, assignedTables, assignedColumns, setBlocked, toastRef, t, loadData]);

  // Cancelar cambios
  const cancelChanges = useCallback(() => {
    if (hasChanges()) {
      confirmDialog({
        message: t('common.unsavedChangesMessage'),
        header: t('common.confirmAction'),
        icon: "pi pi-exclamation-triangle",
        accept: () => {
          setTableSelections(JSON.parse(JSON.stringify(originalSelections)));
        }
      });
    }
  }, [hasChanges, originalSelections, t]);

  // Sincronizar prompt system
  const syncPromptSystem = useCallback(async () => {
    if (!tablesGroupId || syncInProgress) return;
    
    try {
      setSyncInProgress(true);
      setBlocked(true);
      
      // Ejecutar updatePromptSystem
      const response = await tablesGroupService.updatePromptSystem(parseInt(tablesGroupId));
      
      if (response.status === 200) {
        MessageUtils.showSuccess(toastRef, t('tablesGroupConfig.promptSystemUpdated'));
        
        // Recargar la página después de completar la actualización
        await loadData();
      } else {
        MessageUtils.showError(toastRef, response.message || t('tablesGroupConfig.promptSystemUpdateError'));
      }
      
    } catch (error) {
      MessageUtils.handleApiError(toastRef, error, t('tablesGroupConfig.promptSystemUpdateError'));
    } finally {
      setSyncInProgress(false);
      setBlocked(false);
    }
  }, [tablesGroupId, syncInProgress, toastRef, t, loadData, setBlocked]);

  // Templates para la tabla
  const tableCheckboxTemplate = useCallback((rowData: TableWithColumns) => {
    const selection = tableSelections.find(s => s.tableId === rowData.id);
    const isSelected = selection?.isSelected || false;
    
    return (
      <Checkbox
        checked={isSelected}
        onChange={(e) => handleTableSelection(rowData.id, e.checked || false)}
      />
    );
  }, [tableSelections, handleTableSelection, refreshKey]);

  const columnCountTemplate = useCallback((rowData: TableWithColumns) => {
    const selection = tableSelections.find(s => s.tableId === rowData.id);
    const selectedCount = selection?.selectedColumns.length || 0;
    const totalCount = rowData.columns.length;
    
    return (
      <div className="flex align-items-center gap-2">
        <Badge value={`${selectedCount}/${totalCount}`} severity={selectedCount > 0 ? "success" : "secondary"} />
      </div>
    );
  }, [tableSelections, refreshKey]);

  const columnsExpandTemplate = useCallback((rowData: TableWithColumns) => {
    if (!rowData.columns || rowData.columns.length === 0) {
      return <div className="p-3">{t('tablesGroupConfig.noColumnsFound')}</div>;
    }

    const selection = tableSelections.find(s => s.tableId === rowData.id);
    
    const columnCheckboxTemplate = (column: EnvTableColumnResponse) => {
      const isColumnSelected = selection?.selectedColumns.includes(column.id) || false;
      return (
        <Checkbox
          checked={isColumnSelected}
          onChange={(e) => handleColumnSelection(rowData.id, column.id, e.checked || false)}
        />
      );
    };

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
          <Column 
            header={t('common.select')} 
            body={columnCheckboxTemplate} 
            style={{ width: '10%' }}
          />
          <Column field="name" header={t('column.name')} style={{ width: '30%' }} />
          <Column field="data_type" header={t('column.type')} body={columnTypeTemplate} style={{ width: '20%' }} />
          <Column field="description" header={t('column.description')} style={{ width: '25%' }} />
          <Column field="business_name" header={t('column.businessName')} style={{ width: '15%' }} />
        </DataTable>
      </div>
    );
  }, [tableSelections, handleColumnSelection, t, refreshKey]);

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
              onClick={() => navigate(`/tablegroups/${tablesGroup?.environment_id || ''}`)}
              tooltip={t('common.back')}
            />
            <h1>{t('tablesGroupConfig.title')} - {tablesGroup?.name}</h1>
          </div>
          <div className="flex gap-2">
            <Button
              label={t('common.cancel')}
              className="p-button-outlined"
              icon="pi pi-times"
              onClick={cancelChanges}
              disabled={!hasChanges()}
            />
            <Button
              label={t('common.save')}
              className="button-primary"
              icon="pi pi-check"
              onClick={saveChanges}
              disabled={!hasChanges()}
            />
          </div>
        </div>
      </motion.div>

      {/* Panel de información del grupo de tablas */}
      {tablesGroup && (
        <Panel 
          header={
            <div className="flex align-items-center justify-content-between w-full">
              <span> {t('tablesGroupCRUD.promptSystemLabel')}&nbsp;</span>
              <Button
                icon="pi pi-sync"
                className="p-button-sm p-button-outlined p-button-info"
                onClick={syncPromptSystem}
                tooltip={t('tablesGroupConfig.syncPromptSystemTooltip')}
                tooltipOptions={{ position: "bottom" }}
              />
            </div>
          } 
          className="mb-3"
        >
          <div className="grid">
            <div className="col-12">
              <div 
                className="w-full p-3 border-1 surface-border border-round"
                style={{ 
                  backgroundColor: '#f8f9fa', 
                  minHeight: '80px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  fontSize: '12px',
                  lineHeight: '1.5'
                }}
              >
                {tablesGroup.prompt_system || t('common.notAvailable')}
              </div>
            </div>
          </div>
        </Panel>
      )}

      <div className="flex-1">
        <DataTable
          key={`table-${refreshKey}`}
          value={tables}
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={columnsExpandTemplate}
          dataKey="id"
          className="p-datatable-sm"
          emptyMessage={t('tablesGroupConfig.noTablesFound')}
        >
          <Column expander style={{ width: '5%' }} />
          <Column 
            header={t('common.select')} 
            body={tableCheckboxTemplate} 
            style={{ width: '10%' }} 
          />
          <Column field="name" header={t('table.name')} style={{ width: '25%' }} />
          <Column field="description" header={t('table.description')} style={{ width: '30%' }} />
          <Column field="table_type" header={t('table.type')} style={{ width: '15%' }} />
          <Column 
            header={t('tablesGroupConfig.selectedColumns')} 
            body={columnCountTemplate} 
            style={{ width: '15%' }} 
          />
        </DataTable>
      </div>
    </div>
  );
};

export default TablesGroupTableColumn;