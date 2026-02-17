import { motion } from "framer-motion";
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { Splitter, SplitterPanel } from "primereact/splitter";
import { Tree } from "primereact/tree";
import { envTableService } from "../services/envTableService";
import { environmentService } from "../services/environmentService";
import { EnvTableResponse } from "../types/envTable";
import { EnvironmentResponse } from "../types/environment";
import { MessageUtils } from "../utils/MessageUtils";
import { useGlobal } from "../context/GlobalContext";
import { useTranslation } from "react-i18next";
import { FloatLabel } from "primereact/floatlabel";
import { InputTextarea } from "primereact/inputtextarea";
import { Message } from "primereact/message";
import { InputText } from "primereact/inputtext";

interface EnvironmentTablesPageProps {}

const EnvironmentTablesPage: React.FC<EnvironmentTablesPageProps> = () => {
  const { t, i18n } = useTranslation();
  const { toastRef, setBlocked } = useGlobal();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const { environmentId } = useParams<{ environmentId: string }>();
  
  const [environment, setEnvironment] = useState<EnvironmentResponse | null>(null);
  const [tables, setTables] = useState<EnvTableResponse[]>([]);
  const [profileName, setProfileName] = useState<string>("");
  const [profileDescription, setProfileDescription] = useState<string>("");
  
  const [treeNodes, setTreeNodes] = useState<any[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<any>({});
  const [selectedKeys, setSelectedKeys] = useState<any>({});


  // Función para obtener el icono de tabla
  const getTableIcon = useCallback((tableType: string | null | undefined): string => {
    if (tableType === "view") {
      return '/src/assets/dbview-icon.png';
    }
    return '/src/assets/dbtable-icon.png';
  }, []);

  // Función para generar nodos del árbol
  const generateTreeNodes = useCallback((tables: EnvTableResponse[], environmentName: string) => {
    return [{
      key: 'root',
      label: environmentName,
      icon:  '/src/assets/database2-icon.png',
      data: { type: 'environment' },
      selectable: true,
      children: tables.map((table) => ({
        key: table.id.toString(),
        label: table.name,
        icon: getTableIcon(table.table_type),
        data: table,
        selectable: true,
        children: table.columns?.map((column) => ({
          key: `${table.id}-${column.id}`,
          label: `${column.name} (${column.data_type})`,
          icon: column.is_pk ? '/src/assets/dbkey-icon.png' : '/src/assets/tablecolumn-icon.png',
          data: column,
          selectable: true
        })) || []
      }))
    }];
  }, [getTableIcon]);

  // Cargar datos iniciales
  const loadData = useCallback(async () => {
    if (!environmentId) return;
    
    setLoading(true);
    try {
      // Cargar datos del environment
      const environmentResponse = await environmentService.getById(parseInt(environmentId));
      if (environmentResponse.result) {
        setEnvironment(environmentResponse.result);
        setProfileName(environmentResponse.result.name);
        setProfileDescription(environmentResponse.result.description);
      }
      // Cargar tablas del environment
      const tablesResponse = await envTableService.getByEnvironmentId(parseInt(environmentId));
      const tablesData = tablesResponse.result || [];
      setTables(tablesData);
      // Generar nodos del árbol
      const nodes = generateTreeNodes(tablesData, environmentResponse.result?.name || 'Environment');
      setTreeNodes(nodes);


      // Expandir todos los nodos
      const allExpandedKeys: any = {};
      allExpandedKeys['root'] = true; // Expandir nodo raíz
      //tablesData.forEach(table => {
      //  allExpandedKeys[table.id.toString()] = true; // Expandir todas las tablas
      //});
      setExpandedKeys(allExpandedKeys);
      
      // Seleccionar todos los nodos
      const allSelectedKeys: any = {};
      allSelectedKeys['root'] = { checked: true }; // Seleccionar nodo raíz
      tablesData.forEach(table => {
        allSelectedKeys[table.id.toString()] = { checked: true }; // Seleccionar todas las tablas
        table.columns?.forEach(column => {
          allSelectedKeys[`${table.id}-${column.id}`] = { checked: true }; // Seleccionar todos los campos
        });
      });
      setSelectedKeys(allSelectedKeys);

    } catch (error) {
      MessageUtils.handleApiError(toastRef, error, t('actions.loadData'));
    } finally {
      setLoading(false);
    }
  }, [environmentId, toastRef, t, generateTreeNodes]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  

  const handleTreeExpansion = useCallback((event: any) => {
    setExpandedKeys(event.value);
  }, []);

  const handleTreeSelection = useCallback((event: any) => {
    console.log(event);
    setSelectedKeys(event.value);
  }, []);
  

  
  // Guardar cambios (placeholder para futura implementación)
  const handleSave = useCallback(async () => {
    setBlocked(true);
    try {
      // TODO: Implementar servicio para guardar perfil y tablas seleccionadas
      MessageUtils.showSuccess(toastRef, t('common.savedSuccessfully'));
    } catch (error) {
      MessageUtils.handleApiError(toastRef, error, t('actions.save'));
    } finally {
      setBlocked(false);
    }
  }, [setBlocked, toastRef, t]);

  // Sincronizar tablas y columnas
  const handleSynchronize = useCallback(async () => {
    if (!environmentId) return;
    
    setBlocked(true);
    try {
      const response = await envTableService.synchronize(parseInt(environmentId));
      
      if (response.status === 200) {
        MessageUtils.showSuccess(toastRef, t('environmentTablesPage.syncSuccess'));
        
        // Recargar datos después de sincronización
        await loadData();
      } else {
        MessageUtils.showError(toastRef, response.message || t('environmentTablesPage.syncError'));
      }
    } catch (error) {
      MessageUtils.handleApiError(toastRef, error, t('environmentTablesPage.syncError'));
    } finally {
      setBlocked(false);
    }
  }, [environmentId, setBlocked, toastRef, t, loadData]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-column">
      <style>{`
        .p-tree{
          padding: 0.25rem;
        }
        .compact-tree .p-tree-container .p-treenode {
          padding: 1px 0;
        }
        .compact-tree .p-tree-container .p-treenode-content {
          padding: 2px 4px;
          margin: 0;
        }
        .compact-tree .p-tree-container .p-treenode-children {
          padding-left: 16px;
        }
        .compact-tree .p-tree-container .p-tree-toggler {
          width: 16px;
          height: 16px;
          margin-right: 4px;
        }
        .compact-tree .p-tree-container .p-checkbox {
          margin-right: 4px;
        }
        .p-inline-message .p-inline-message-text {
          font-size: 0.75rem !important;
        }
        .compact-tree .p-button {
          padding: 0 !important;
          margin: 0 !important;
        }
      `}</style>



      <motion.div
        initial={{ opacity: 0, x: 120 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
      >
        <div className="flex align-items-center justify-content-between">
          <div className="flex align-items-center gap-3">
            <Button
              icon="pi pi-arrow-left"
              className="p-button-text"
              onClick={() => navigate('/environments')}
              tooltip={t('common.back')}
            />
            <div className="flex align-items-center gap-2">
              <h1>{t('tablesGroupManagement.titleconfig')}</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              label={t('environmentTablesPage.synchronize')}
              className="p-button-outlined p-button-info"
              icon="pi pi-sync"
              onClick={handleSynchronize}
              tooltip={t('environmentTablesPage.synchronizeTooltip')}
              tooltipOptions={{ position: "bottom" }}
            />
            <Button
              label={t('common.cancel')}
              className="p-button-outlined"
              icon="pi pi-times"
              onClick={() => navigate('/environments')}
            />
            <Button
              label={t('common.save')}
              className="button-primary"
              icon="pi pi-check"
              onClick={handleSave}
            />
          </div>
        </div>
      </motion.div>



      <div className="col-12 pb-0">
        <div className="grid">
          <div className="col-12 pb-0 lg:col-4">
              <FloatLabel>
                <InputText 
                  id="profileName" 
                  value={profileName} 
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full"
                />
                <label htmlFor="profileName">Nombre del Grupo de Tablas</label>
              </FloatLabel>
          </div>
          <div className="col-12 pb-0 lg:col-8">
              <FloatLabel>
                <InputTextarea 
                  id="profileDescription" 
                  value={profileDescription} 
                  onChange={(e) => setProfileDescription(e.target.value)} 
                  rows={2}
                  className="w-full"
                />
                <label htmlFor="profileDescription">Descripción del Grupo de Tablas</label>
              </FloatLabel>
          </div>
        </div>
      </div>





      <div className="col-12 flex-1">
        <Splitter style={{ height: 'calc(100vh - 300px)', minHeight: '400px' }}>
          <SplitterPanel size={20} minSize={10}>
            <div className="h-full flex flex-column w-full">
              <div className="flex align-items-center justify-content-between">
                <Message severity="info" text="Seleccione las tablas y columnas a las que tendrá acceso el grupo de tablas. Edite información semántica." />
              </div>
              
              <div className="flex-1 overflow-auto">
                <Tree
                  value={treeNodes}
                  selectionMode="checkbox"
                  className="w-full compact-tree"
                  style={{ 
                    fontSize: '0.875rem',
                    lineHeight: '1.25rem'
                  }}
                  expandedKeys={expandedKeys}
                  selectionKeys={selectedKeys}
                  onToggle={handleTreeExpansion}
                  onSelectionChange={handleTreeSelection}
                  filter filterMode="strict"
                  filterPlaceholder="Buscar..."
                  nodeTemplate={(node) => (
                    <div className="flex align-items-center gap-1" style={{ padding: '2px 0', minHeight: '20px' }}>
                      {node.icon && (
                          <img 
                            src={typeof node.icon === 'string' ? node.icon : ''} 
                            alt={node.data?.table_type === "view" ? "View" : node.data?.is_pk ? "Primary Key" : "Table"} 
                            style={{ width: '14px', height: '14px' }}
                          />
                      )}
                        <span style={{ fontSize: '0.875rem', lineHeight: '1.2' }}>{node.label}</span>
                        <Button 
                          icon="pi pi-pencil" 
                          size="small"
                          className="p-button-text p-button-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Edit clicked for:', node.label);
                          }}
                        />
                    </div>
                  )}
                />
              </div>
            </div>
          </SplitterPanel>
          
          <SplitterPanel size={80} minSize={30}>
            <div className="h-full flex align-items-center justify-content-center">
              <div className="text-center text-500">
                <i className="pi pi-info-circle text-4xl mb-3"></i>
                <p>Use el botón Editar de cada tabla o columna para modificar su información semántica.</p>
              </div>
            </div>
          </SplitterPanel>
        </Splitter>
      </div>
    </div>
  );
};

export default EnvironmentTablesPage;
