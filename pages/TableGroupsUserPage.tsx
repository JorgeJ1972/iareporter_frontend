import { motion } from "framer-motion";
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Panel } from "primereact/panel";
import { Card } from "primereact/card";
import { Checkbox } from "primereact/checkbox";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { Tooltip } from "primereact/tooltip";
import { environmentService } from "../services/environmentService";
import { userService } from "../services/userService";
import { EnvironmenTablesGroups } from "../types/environment";
import { MessageUtils } from "../utils/MessageUtils";
import { useGlobal } from "../context/GlobalContext";
import { useTranslation } from "react-i18next";
import { UserResponse } from "../types/user";

interface TableGroupsUserPageProps {}

const TableGroupsUserPage: React.FC<TableGroupsUserPageProps> = () => {
  const { t, i18n } = useTranslation();
  const { toastRef, setBlocked } = useGlobal();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  
  const [environments, setEnvironments] = useState<EnvironmenTablesGroups[]>([]);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [userTablesGroups, setUserTablesGroups] = useState<number[]>([]);
  const [selectedTablesGroups, setSelectedTablesGroups] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedEnvironment, setSelectedEnvironment] = useState<EnvironmenTablesGroups | null>(null);
  const [expandedPanels, setExpandedPanels] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);

  // Función para obtener el icono de base de datos
  const getDatabaseIcon = useCallback((databaseType: string): string => {
    switch (databaseType.toLowerCase()) {
      case 'mysql':
        return '/src/assets/mysql-icon.png';
      case 'postgresql':
        return '/src/assets/postgresql-icon.png';
      case 'oracle':
        return '/src/assets/oracle-icon.png';
      case 'sql server':
      case 'microsoft sql server':
        return '/src/assets/sql-server-icon.png';
      default:
        return '/src/assets/database-icon.png';
    }
  }, []);

  // Cargar datos iniciales
  const loadData = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Cargar datos del usuario
      const userResponse = await userService.getById(parseInt(userId));
      if (userResponse.result) {
        setUser(userResponse.result);
      }
      
      // Cargar environments con tables groups
      const environmentsResponse = await environmentService.getActiveEnvironmentsWithTablesGroups();
      setEnvironments(environmentsResponse.result || []);
      
      // Cargar tables groups del usuario
      const userGroupsResponse = await userService.getUserTablesGroups(parseInt(userId));
      const userGroups = userGroupsResponse.result?.tables_group_ids || [];
      setUserTablesGroups(userGroups);
      setSelectedTablesGroups(userGroups);
      
    } catch (error) {
      MessageUtils.handleApiError(toastRef, error, t('actions.loadData'));
    } finally {
      setLoading(false);
    }
  }, [userId, toastRef, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrar environments basado en búsqueda y selección
  const filteredEnvironments = useCallback(() => {
    let filtered = environments;

    // Filtrar por environment seleccionado
    if (selectedEnvironment) {
      filtered = filtered.filter(env => env.id === selectedEnvironment.id);
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(env => 
        env.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        env.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        env.tables_groups.some(tg => 
          tg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tg.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    return filtered;
  }, [environments, selectedEnvironment, searchTerm]);

  // Manejar selección/deselección de tables groups
  const handleTablesGroupToggle = useCallback((tablesGroupId: number) => {
    setSelectedTablesGroups(prev => {
      if (prev.includes(tablesGroupId)) {
        return prev.filter(id => id !== tablesGroupId);
      } else {
        return [...prev, tablesGroupId];
      }
    });
  }, []);

  // Expandir/contraer todos los paneles
  const toggleAllPanels = useCallback((expand: boolean) => {
    if (expand) {
      const allIds = new Set(filteredEnvironments().map(env => env.id));
      setExpandedPanels(allIds);
    } else {
      setExpandedPanels(new Set());
    }
  }, [filteredEnvironments]);

  // Guardar cambios
  const handleSave = useCallback(async () => {
    if (!userId) return;
    
    setBlocked(true);
    try {
      await userService.assignTablesGroupsToUser(parseInt(userId), selectedTablesGroups);
      MessageUtils.showSuccess(toastRef, t('userManagement.tablesGroupsAssignedSuccess'));
      setUserTablesGroups(selectedTablesGroups);
      // Redirigir a la página de usuarios después de guardar exitosamente
      navigate('/users');
    } catch (error) {
      MessageUtils.handleApiError(toastRef, error, t('actions.saveTablesGroups'));
    } finally {
      setBlocked(false);
    }
  }, [userId, selectedTablesGroups, setBlocked, toastRef, t, navigate]);

  // Contar tables groups seleccionados por environment
  const getSelectedCountForEnvironment = useCallback((environment: EnvironmenTablesGroups) => {
    return environment.tables_groups.filter(tg => selectedTablesGroups.includes(tg.id)).length;
  }, [selectedTablesGroups]);

  // Renderizar header del panel con icono, contador y descripción
  const renderPanelHeader = useCallback((environment: EnvironmenTablesGroups) => {
    const selectedCount = getSelectedCountForEnvironment(environment);
    const totalCount = environment.tables_groups.length;
    
    const handleHeaderClick = () => {
      const newExpanded = new Set(expandedPanels);
      const isCurrentlyExpanded = expandedPanels.has(environment.id);
      
      if (isCurrentlyExpanded) {
        newExpanded.delete(environment.id);
      } else {
        newExpanded.add(environment.id);
      }
      
      setExpandedPanels(newExpanded);
    };
    
    return (
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            cursor: 'pointer',
            width: '100%'
          }}
          onClick={handleHeaderClick}
        >
          <img 
            src={getDatabaseIcon(environment.database_type_name || '')} 
            alt="Database" 
            style={{ width: '24px', height: '24px' }}
          />
          <span style={{ fontWeight: 'bold' }}>{environment.name}</span>
          <span style={{ 
            backgroundColor: selectedCount > 0 ? '#4CAF50' : '#9E9E9E', 
            color: 'white', 
            padding: '2px 8px', 
            borderRadius: '12px', 
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {selectedCount}/{totalCount}
          </span>
          <div className="text-400 text-xs ml-5">
            {environment.description && environment.description.length > 50 
              ? `${environment.description.substring(0, 50)}...`
              : environment.description
            }
          </div>
        </div>
    );
  }, [getDatabaseIcon, getSelectedCountForEnvironment, expandedPanels]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <>
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
            onClick={() => navigate('/users')}
            tooltip={t('common.back')}
          />
          <div className="flex align-items-center gap-2">
            <h1>{t('userManagement.assignTablesGroupsTitle')}</h1>
            {user && (
              <>
                <span className="text-400 text-sm">-</span>
                <span 
                  className="text-500 text-sm cursor-pointer"
                  data-pr-tooltip={`${t('userManagement.username')}: ${user.username}`}
                  data-pr-position="bottom"
                >
                  {user.full_name}
                </span>
                <Tooltip target=".cursor-pointer" />
              </>
            )}
          </div>
        </div>
          <div className="flex gap-2">
            <Button
              label={t('common.cancel')}
              className="p-button-outlined"
              icon="pi pi-times"
              onClick={() => navigate('/users')}
            />
            <Button
              label={t('common.save')}
              className="button-primary"
              icon="pi pi-check"
              onClick={handleSave}
              disabled={selectedTablesGroups.length === userTablesGroups.length && 
                       selectedTablesGroups.every(id => userTablesGroups.includes(id))}
            />
          </div>
        </div>
      </motion.div>

      {/* Controles de filtrado y acciones */}
      <div className="col-12">
        <div className="flex flex-column gap-3">
          {/* Filtros */}
          <div className="flex gap-3 align-items-center">
            <div className="flex-1">
              <span className="p-input-icon-left w-full">
                <i className="pi pi-search" style={{ paddingLeft: '1rem' }} />
                <InputText
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('userManagement.searchTablesGroups')}
                  className="w-full"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </span>
            </div>
            <Dropdown
              value={selectedEnvironment}
              onChange={(e) => setSelectedEnvironment(e.value)}
              options={environments}
              optionLabel="name"
              placeholder={t('userManagement.selectEnvironment')}
              showClear
              className="w-20rem"
            />
            <div className="text-900 font-bold">
              {t('userManagement.selectedTablesGroups', { count: selectedTablesGroups.length })}
            </div>
            <div className="flex">
              <Button
                icon="pi pi-angle-double-down"
                label={t('userManagement.expandAll')}
                className="p-button-text"
                onClick={() => toggleAllPanels(true)}
              />
              <Button
                icon="pi pi-angle-double-up"
                label={t('userManagement.collapseAll')}
                className="p-button-text"
                onClick={() => toggleAllPanels(false)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de environments con tables groups */}
      <div className="mt-1">
          {filteredEnvironments().map((environment) => (
            <Panel
              key={environment.id}
              header={renderPanelHeader(environment)}
              toggleable
              collapsed={!expandedPanels.has(environment.id)}
              onToggle={(e) => {
                const newExpanded = new Set(expandedPanels);
                const isCurrentlyExpanded = expandedPanels.has(environment.id);
                
                if (isCurrentlyExpanded) {
                  newExpanded.delete(environment.id);
                } else {
                  newExpanded.add(environment.id);
                }
                
                setExpandedPanels(newExpanded);
              }}
              className="mb-1"
            >
              <div className="grid">
                {environment.tables_groups.map((tablesGroup) => (
                  <div key={tablesGroup.id} className="col-12 md:col-6 lg:col-4 xl:col-3">
                    <Card className="h-full">
                      <div className="flex align-items-center gap-3">
                        <Checkbox
                          checked={selectedTablesGroups.includes(tablesGroup.id)}
                          onChange={() => handleTablesGroupToggle(tablesGroup.id)}
                        />
                        <div className="flex-1">
                          <h3 className="m-0 text-lg font-semibold">{tablesGroup.name}</h3>
                          <p className="m-0 text-500 text-sm mt-1">
                            {tablesGroup.description && tablesGroup.description.length > 100 
                              ? `${tablesGroup.description.substring(0, 100)}...`
                              : tablesGroup.description
                            }
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
              
              {environment.tables_groups.length === 0 && (
                <div className="text-center text-500 p-4">
                  {t('common.noTablesGroupsFound')}
                </div>
              )}
            </Panel>
          ))}

        {filteredEnvironments().length === 0 && (
          <div className="text-center text-500 p-8">
            {t('userManagement.noEnvironmentsFound')}
          </div>
        )}
      </div>
    </>
  );
};

export default TableGroupsUserPage;
