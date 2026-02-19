import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toolbar } from 'primereact/toolbar';
import { confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import {reportService}  from '../services/reportService';
import { Report } from '../types/report';
import { TableGroup } from '../types/tableGroupt'; // Asumo que tienes este tipo
import { tablesGroupService } from '../services/tablesGroupService'; // Corrige el nombre de la función importada
import { ReportTestDialog } from '../components/reports/ReportTestDialog';

import { ReportDialog } from '../components/reports/ReportDialog';
import { ParamsDialog } from '../components/reports/ParamsDialog';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Tag } from 'primereact/tag';

const ManageReports = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [tableGroups, setTableGroups] = useState<TableGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    
    const [reportDialog, setReportDialog] = useState(false);
    const [paramsDialog, setParamsDialog] = useState(false);
    const [testReport, setTestReport] = useState<Report | null>(null);
    const [testDialogVisible, setTestDialogVisible] = useState(false);
   
    const toast = useRef<Toast>(null);
    const { t } = useTranslation();

    useEffect(() => {
        tablesGroupService.getTablesGroupAll().then(response => {
            if (response.result) {
                console.log(response.result);
                setTableGroups(response.result);
                if (response.result.length > 0) {
                    setSelectedGroup(response.result[0].id);
                }
            } else {
                setTableGroups([]);
            }
        });
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            loadReports(selectedGroup);
        }
    }, [selectedGroup]);

    const loadReports = (groupId: number) => {
        reportService.getReports(groupId).then(response => setReports(response.result));
        console.log(reports);
    };

    const openNewReport = () => {
        setSelectedGroup(selectedGroup);
        setSelectedReport(null); // Para modo creación
        setReportDialog(true);
    };

    const editReport = (report: Report) => {
        setSelectedReport(report);
        setReportDialog(true);
    };

    const manageParams = (report: Report) => {
        setSelectedReport( { ...report });
        setParamsDialog(true);
    };
    const closeReportDialog = () => {
        setReportDialog(false);
        setSelectedReport(null); // IMPORTANTE: limpia para que al reabrir dispare useEffect
    };

    const toggleReportStatus = (report: Report) => {
        const newStatus = !report.is_enabled;
        confirmDialog({
            message: `${newStatus? t('reports.areYouSureConfirmStatusChangeEnable'): t('reports.areYouSureConfirmStatusChangeDisable')}`,
            header: t('reports.confirmStatusChange'),
            icon: 'pi pi-info-circle',
            acceptClassName: 'p-button-danger',
            accept: () => {
                reportService.updateReport(report.id, {name:report.name, tables_group_id:report.tables_group_id, prompt:report.prompt, query:report.query, is_public:report.is_public,is_enabled: newStatus})
                    .then(() => {
                        toast.current?.show({ severity: 'success', summary: 'Success', detail: `Report ${newStatus ? 'enabled' : 'disabled'}` });
                        loadReports(selectedGroup!);
                    });
            }
        });
    };

    const confirmDeleteReport = (report: Report) => {
        confirmDialog({
            message: t('reports.doYouWantDelete'),
            header: t('reports.deleteConfirmation'),
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                reportService.deleteReport(report.id).then(() => {
                    toast.current?.show({ severity: 'success', summary: 'Success', detail: t('reports.deletedReport') });
                    loadReports(selectedGroup!);
                });
            }
        });
    };

    const leftToolbarTemplate = () => {
        return (
            <div className="flex flex-wrap gap-2">
                <Button label={t('reports.newReport')} icon="pi pi-plus" severity="success" onClick={openNewReport} />
            </div>
        );
    };

    const rightToolbarTemplate = () => {
        return <Dropdown value={selectedGroup} options={tableGroups} onChange={(e) => setSelectedGroup(e.value)} optionLabel="name" optionValue="id" placeholder={t('reports.selectTableGroup')} />;
    };

   const openTest = (report: Report) => {
        setTestReport(report);
        setTestDialogVisible(true);
    };

    const actionBodyTemplate = (rowData: Report) => {
        return (
            <React.Fragment>
                <Button
                    icon="pi pi-play"
                    rounded
                    outlined
                    severity="info"
                    className="mr-2"
                    onClick={() => openTest(rowData)}
                    tooltip={t('reports.testRun')}
                />

                <Button icon="pi pi-pencil" disabled={!rowData.is_enabled} rounded outlined className="mr-2" onClick={() => editReport(rowData)} />
                <Button icon="pi pi-filter" rounded outlined severity="info" disabled={!rowData.is_enabled} className="mr-2" onClick={() => manageParams(rowData)} tooltip={t('reports.manageParameters')} />
                <Button 
                    icon={rowData.is_enabled ? 'pi pi-eye-slash' : 'pi pi-eye'} 
                    rounded 
                    outlined 
                    severity={rowData.is_enabled ? 'warning' : 'success'} 
                    className="mr-3"
                    onClick={() => toggleReportStatus(rowData)}
                    tooltip={rowData.is_enabled ? 'Disable' : 'Enable'}
                />
                <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmDeleteReport(rowData)} disabled={rowData.is_enabled} />

            </React.Fragment>
        );
    };

    const publicBodyTemplate = useCallback((rowData: Report) => {
        return <i className={`pi ${rowData.is_public ? 'pi-check-circle' : 'pi-times-circle'}`}></i>;
    }, []);

    const statusBodyTemplate = useCallback((rowData: Report) => {
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
            <h1>{t('reports.titleManagement')}</h1>
        </motion.div>        
        <div className="card">
            <Toast ref={toast} />
            <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>

            <DataTable value={reports} dataKey="id" paginator rows={5} 
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate={t('reports.showingReports')}
                emptyMessage={t('reports.noReports')}>

                <Column field="name" header={t('common.name')} sortable style={{ minWidth: '16rem' }}></Column>
                <Column field="prompt" header={t('common.prompt')} style={{ minWidth: '20rem' }}></Column>
                <Column align="center" field="is_public" header={t('common.public')} sortable sortField="is_public" body={publicBodyTemplate}></Column>
                <Column align="center" field="is_enabled" header={t('common.status')} sortable sortField="is_enabled" body={statusBodyTemplate}></Column>
                <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '18rem' }}></Column>
            </DataTable>

            {/* Renderiza el diálogo del reporte */}
            <ReportDialog
                key={selectedReport ? `edit-${selectedReport.id}` : 'new'}  // fuerza remount según contexto
                visible={reportDialog}
                onHide={closeReportDialog}
                report={selectedReport}
                tablesGroupId={selectedGroup}
                onSave={() => {
                    if (selectedGroup) {
                        loadReports(selectedGroup);
                    }
                    closeReportDialog(); // asegura limpieza tras guardar
                }}            
            />
            <ParamsDialog
                visible={paramsDialog}
                onHide={() => setParamsDialog(false)}
                report={selectedReport}
            />
        <ReportTestDialog
            visible={testDialogVisible}
            onHide={() => { setTestDialogVisible(false); setTestReport(null); }}
            report={testReport}
        />            
        </div>

    </>
    );
};

export default ManageReports;