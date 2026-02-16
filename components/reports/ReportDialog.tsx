import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputSwitch, InputSwitchChangeEvent } from 'primereact/inputswitch';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useTranslation } from 'react-i18next';

import { Report} from '../../types/report';
import {reportService}  from '../../services/reportService';


interface ReportDialogProps {
    visible: boolean;
    onHide: () => void;
    report: Report | null;   
    tablesGroupId: number | null;
    onSave: () => void;
}

const emptyReport: Partial<Report> = {
    name: '',
    tables_group_id: 0,
    prompt: '',
    query: '',
    is_public: false,
    is_enabled: true
};

export const ReportDialog = ({ visible, onHide, report, tablesGroupId, onSave }: ReportDialogProps) => {
    const [reportData, setReportData] = useState<Partial<Report>>(emptyReport);
    const [submitted, setSubmitted] = useState(false);
    const [originalPrompt, setOriginalPrompt] = useState<string>(''); // NUEVO
    const [generating, setGenerating] = useState(false); // NUEVO

    const toast = useRef<Toast>(null);
    const { t } = useTranslation();

    useEffect(() => {
        if (report) {
            setReportData(report);
            setOriginalPrompt(report.prompt || '');
        } else {
            setReportData({ ...emptyReport, tables_group_id: tablesGroupId ?? undefined });
            setOriginalPrompt('');
        }
    }, [report, tablesGroupId]);

    const hideDialog = () => {
        setSubmitted(false);
        setReportData(emptyReport);
        onHide();
    };

    const saveReport = async () => {
        setSubmitted(true);

        if (!reportData.name?.trim()) {
            toast.current?.show({ severity: 'error', summary: 'Validation Error', detail: 'Name is required.' });
            return;
        }
        if (!reportData.prompt?.trim()) {
            toast.current?.show({ severity: 'error', summary: 'Validation Error', detail: 'Prompt is required.' });
            return;
        }
        if (!reportData.query?.trim()) {
            toast.current?.show({ severity: 'error', summary: 'Validation Error', detail: 'Query is required.' });
            return;
        }

        try {
            if (report && report.id) {
                // Edit mode
                await reportService.updateReport(
                    report.id,
                    {
                        name: reportData.name!,
                        tables_group_id: reportData.tables_group_id ?? 0, // Provide a default value (e.g., 0) if undefined
                        prompt: reportData.prompt!,
                        query: reportData.query!,
                        is_public: reportData.is_public!,
                        is_enabled: reportData.is_enabled!
                    }
                );
                toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Report Updated' });
            } else {
                // Create mode
                console.log('Creating report with data:', reportData);
                const dataToSave = { ...reportData, owner: 1 }; // Owner hardcoded as 1, should come from auth context
                await reportService.createReport(
                    {
                        name: dataToSave.name!,
                        tables_group_id: dataToSave.tables_group_id ?? 0, // Provide a default value (e.g., 0) if undefined
                        prompt: dataToSave.prompt!,
                        query: dataToSave.query!,
                        is_public: dataToSave.is_public!,
                        is_enabled: dataToSave.is_enabled!,
                        owner: dataToSave.owner!
                    }
                );
                toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Report Created' });
            }
            onSave();
            hideDialog();
        } catch (error: any) {
            toast.current?.show({ severity: 'error', summary: 'Save Failed', detail: error.message || 'An error occurred while saving the report.' });
        }
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, name: keyof Report) => {
        const val = (e.target && e.target.value) || '';
        setReportData(prev => ({ ...prev, [name]: val }));
    };

    const onInputSwitchChange = (e: InputSwitchChangeEvent, name: keyof Report) => {
        const val = e.value ?? false;
        setReportData(prev => ({ ...prev, [name]: val }));
    };

    const dialogFooter = (
        <React.Fragment>
            <Button label={t('actions.cancel')} icon="pi pi-times" outlined onClick={hideDialog} />
            <Button label={t('actions.save')} icon="pi pi-check" onClick={saveReport} />
        </React.Fragment>
    );
    const extractQuery = async () => {
        setSubmitted(true);

        if (!reportData.name?.trim()) {
            toast.current?.show({ severity: 'error', summary: 'Validation', detail: t('reports.nameIsRequired') });
            return;
        }
        if (!reportData.prompt?.trim()) {
            toast.current?.show({ severity: 'error', summary: 'Validation', detail: t('reports.promptIsRequired') });
            return;
        }

        try {
            setGenerating(true);
            if (report && report.id) {
                // Modo edición: enviar query vacío para forzar regeneración SI prompt cambió
                await reportService.updateReport(
                    report.id,
                    {
                        name: reportData.name!,
                        tables_group_id: reportData.tables_group_id ?? 0,
                        prompt: reportData.prompt!,
                        query: "", // fuerza al backend a regenerar (si cambió el prompt)
                        is_public: reportData.is_public!,
                        is_enabled: reportData.is_enabled!
                    }
                );
                toast.current?.show({ severity: 'success', summary: t('reports.updated'), detail: t('reports.queryRegenerated') });
            } else {
                // Creación: enviar query vacío para que backend genere
                const dataToSave = { ...reportData, owner: 1 };
                await reportService.createReport(
                    {
                        name: dataToSave.name!,
                        tables_group_id: dataToSave.tables_group_id ?? 0,
                        prompt: dataToSave.prompt!,
                        query: "",
                        is_public: dataToSave.is_public!,
                        is_enabled: dataToSave.is_enabled!,
                        owner: dataToSave.owner!
                    }
                );
                toast.current?.show({ severity: 'success', summary: t('reports.created'), detail: t('reports.queryGenerated') });
            }
            onSave();
            setOriginalPrompt(reportData.prompt || '');
            setGenerating(false);
            onHide();
        } catch (error: any) {
            setGenerating(false);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message || 'Error' });
        }
    }
    const promptChanged = report ? (reportData.prompt || '') !== originalPrompt : true; // NUEVO

    return (
        <Dialog
            visible={visible}
            style={{ width: '450px' }}
            header={report ? t('reports.editReport') : t('reports.newReport')}
            modal
            className="p-fluid"
            footer={dialogFooter}
            onHide={hideDialog}
        >
            <Toast ref={toast} />
            <div className="field">
                <label htmlFor="name" className="font-bold">
                    {t('reports.name')}
                </label>
                <InputText
                    id="name"
                    value={reportData.name || ''}
                    onChange={(e) => onInputChange(e, 'name')}
                    required
                    autoFocus
                    className={classNames({ 'p-invalid': submitted && !reportData.name })}
                />
                {submitted && !reportData.name && <small className="p-error">{t('reports.nameIsRequired')}.</small>}
            </div>

            <div className="field">
                <label htmlFor="prompt" className="font-bold">
                    {t('reports.prompt')}
                </label>
                <InputTextarea id="prompt" value={reportData.prompt || ''} onChange={(e) => onInputChange(e, 'prompt')} rows={5} cols={30} />
            </div>
            <div className="field">
                 <Button label={t('reports.extractQuery')} 
                 icon="pi pi-clone" 
                 onClick={extractQuery}
                 disabled={generating || (report ? !promptChanged : false)}
                 tooltip={report && !promptChanged ? t('reports.promptNotChanged') : ''}
                 />
            </div>
            <div className="field">
                <label htmlFor="query" className="font-bold">
                    {t('reports.query')}
                </label>
                <InputTextarea id="query" value={reportData.query} onChange={(e) => onInputChange(e, 'query')} rows={5} cols={30} />
            </div>

            <div className="field flex justify-content-between align-items-center">
                <label htmlFor="is_public" className="font-bold">
                    {t('reports.isPublic')}
                </label>
                <InputSwitch
                    id="is_public"
                    checked={reportData.is_public || false}
                    onChange={(e) => onInputSwitchChange(e, 'is_public')}
                />
            </div>
        </Dialog>
    );
};