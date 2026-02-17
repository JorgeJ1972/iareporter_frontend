import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { InputSwitch, InputSwitchChangeEvent } from 'primereact/inputswitch';
import { Calendar } from 'primereact/calendar';
import { Chips, ChipsChangeEvent } from 'primereact/chips';
import { Toast } from 'primereact/toast';
import { confirmDialog } from 'primereact/confirmdialog';
import { classNames } from 'primereact/utils';

import { Report, ReportParamResponse, ReportParamType,ReportParamUpdate, ReportParamCreate } from '../../types/report';
import { reportService } from '../../services/reportService';
import { useTranslation } from 'react-i18next';

// --- Props Interface ---
interface ParamsDialogProps {
    visible: boolean;
    onHide: () => void;
    report: Report | null;
}

// --- Helper functions for data conversion ---

/**
 * Formats a Date object to "yyyy/mm/dd" or "yyyy/mm/dd HH:MM:ss"
 */
const formatDate = (date: Date, includeTime: boolean): string => {
    const pad = (num: number) => num.toString().padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    if (!includeTime) {
        return `${yyyy}/${mm}/${dd}`;
    }
    const HH = pad(date.getHours());
    const MM = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${yyyy}/${mm}/${dd} ${HH}:${MM}:${ss}`;
};

/**
 * Parses the `{...}` string from the backend into a value the component can use.
 */
const parseValuesForComponent = (values: string | null, typeId: number): any => {
    if (!values) return null;
    const contentMatch = values.match(/^{([^{}]*)}$/);
    if (!contentMatch) return null;
    const content = contentMatch[1];

    if (content.includes('...')) { // Range
        const parts = content.split('...');
        if (typeId === 3 || typeId === 4) {
            return parts.map(p => new Date(p));
        }
        return parts; // Keep as string array for other types
    } else { // List
        const list = content ? content.split(',').map(item => item.trim()) : [];
        if (typeId === 3 || typeId === 4) {
            return list.map(p => new Date(p));
        }
        return list;
    }
};

/**
 * Formats the component's value back into the `{...}` string for the backend.
 */
const formatValuesToString = (compValue: any, typeId: number, isRange: boolean): string => {
    if (!compValue || compValue.length === 0) return '{}';
    const format = (val: any) => (typeId === 3 || typeId === 4) ? formatDate(val, typeId === 4) : val;
    const separator = isRange ? '...' : ',';
    return `{${Array.isArray(compValue) ? compValue.map(format).join(separator) : format(compValue)}}`;
}

// --- Helper Validation Function ---
const validateParamValues = (paramTypeId: number, values: string | null): string | null => {
    if (!values || values.trim() === '') {
        return null; // Empty is allowed
    }

    const trimmedValues = values.trim();
    const contentMatch = trimmedValues.match(/^{([^{}]*)}$/);

    if (!contentMatch) {
        return "Invalid format. Values must be enclosed in curly braces, e.g., {1,2,3} or {1...100}.";
    }

    const content = contentMatch[1].trim();
    if (content === '') {
        return null; // {} is valid
    }

    // Range validation
    if (content.includes('...')) {
        const parts = content.split('...').map(p => p.trim());
        if (parts.length !== 2 || parts.some(p => p === '')) {
            return "Invalid range format. Must be {start...end}.";
        }
        if (paramTypeId === 1) { // Numeric
            if (!/^\d+$/.test(parts[0]) || !/^\d+$/.test(parts[1])) {
                return "Numeric range values must be integers.";
            }
        } else if (paramTypeId === 3 || paramTypeId === 4) { // Date or Datetime
            const dateRegex = /^\d{4}\/\d{2}\/\d{2}$/;
            const datetimeRegex = /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/;
            const regex = paramTypeId === 3 ? dateRegex : datetimeRegex;
            if (!regex.test(parts[0]) || !regex.test(parts[1])) {
                return `Invalid date/datetime format. Use yyyy/mm/dd or yyyy/mm/dd HH:MM:ss.`;
            }
        }
    }
    // List validation
    else if (paramTypeId === 1) { // Numeric list
        const items = content.split(',').map(item => item.trim());
        if (items.some(item => !/^\d+$/.test(item))) {
            return "All items in a numeric list must be integers.";
        }
    }

    return null; // No validation errors
};


// --- Main Component ---
export const ParamsDialog = ({ visible, onHide, report }: ParamsDialogProps) => {
    const [params, setParams] = useState<ReportParamResponse[]>([]);
    const [paramTypes, setParamTypes] = useState<ReportParamType[]>([]);
    const [paramDetailDialog, setParamDetailDialog] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [currentParam, setCurrentParam] = useState<Partial<ReportParamResponse> | null>(null);
    const [componentValue, setComponentValue] = useState<any>(null); // State for advanced inputs
    const toast = useRef<Toast>(null);
    const { t } = useTranslation();

    const emptyParam: Partial<ReportParamResponse> = {
        name: '[:param_name]',
        param_type_id: 1,
        values: "{}",
        id: 0,
        report_id:0,
        is_enabled: true
    };

    // Fetch parameter types once on mount
    useEffect(() => {
        reportService.getReportParamTypes().then(response => setParamTypes(response.result));
    }, []);

    // Fetch params when the dialog becomes visible or the report changes
    useEffect(() => {
        if (visible && report) {
            loadParams();
            setComponentValue(null); // Reset on dialog open
        }
    }, [visible, report]);

    const loadParams = () => {
        if (report) {
            reportService.getReportParamResponse(report.id).then(response => {
                if (Array.isArray(response.result)) {
                    setParams(response.result);
                } else {
                    setParams([]);
                }
            });
        }
    };

    const openNew = () => {
        setCurrentParam(emptyParam);
        setComponentValue(parseValuesForComponent(
            typeof emptyParam.values === 'string' ? emptyParam.values : null,
            emptyParam.param_type_id!
        ));
        setSubmitted(false);
        setParamDetailDialog(true);
    };

    const editParam = (param: ReportParamResponse) => {
        setCurrentParam({ ...param });
        setComponentValue(parseValuesForComponent(param.values?.toString() || null, param.param_type_id));
        setParamDetailDialog(true);
    };

    const hideDetailDialog = () => {
        setSubmitted(false);
        setParamDetailDialog(false);
    };

    const saveParam = async () => {
        setSubmitted(true);

        if (!currentParam || !currentParam.name?.trim()) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: t('reports.nameIsRequired') });
            return;
        }

        // The client-side text validation is no longer the primary source of truth
        // as components generate the correct format. Backend validation remains key.
        // const validationError = validateParamValues(currentParam.param_type_id!, currentParam.values);
        // if (validationError) {
        //     toast.current?.show({ severity: 'error', summary: 'Validation Error', detail: validationError, life: 5000 });
        //     return;
        // }
        try {
            if (currentParam.id) {
                // Update
                await reportService.updateParam(currentParam.id, 
                    {
                        name: currentParam.name!,
                        param_type_id: currentParam.param_type_id!,
                        values: currentParam.values,
                        //values: formatValuesToString(currentParam.values, currentParam.param_type_id!, false),
                        is_enabled: currentParam.is_enabled!
                    } as ReportParamUpdate);
                toast.current?.show({ severity: 'success', summary: 'Successful', detail: 'Parameter Updated' });
            } else {
                // Create
                await reportService.createParam(report!.id, {
                    name: currentParam.name!,
                    param_type_id: currentParam.param_type_id!,
                    values: currentParam.values,
                    //values: formatValuesToString(currentParam.values, currentParam.param_type_id!, false),
                    is_enabled: currentParam.is_enabled!
                } as ReportParamCreate);
                toast.current?.show({ severity: 'success', summary: 'Successful', detail: 'Parameter Created' });
            }
            loadParams();
            setParamDetailDialog(false);
            setCurrentParam(null);
        } catch (error: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message || 'Failed to save parameter' });
        }
    };

    const confirmDeleteParam = (param: ReportParamResponse) => {
        confirmDialog({
            message: 'Are you sure you want to delete this parameter?',
            header: 'Confirm Deletion',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                try {
                    await reportService.deleteParam(param.id);
                    toast.current?.show({ severity: 'success', summary: 'Successful', detail: 'Parameter Deleted' });
                    loadParams();
                } catch (error: any) {
                    toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message || 'Failed to delete parameter' });
                }
            }
        });
    };

    const onDetailInputChange = (e: React.ChangeEvent<HTMLInputElement>, name: keyof ReportParamResponse) => {
        const val = e.target.value;
        setCurrentParam(prev => ({ ...prev, [name]: val }));
    };

    const onDetailDropdownChange = (e: DropdownChangeEvent, name: keyof ReportParamResponse) => {
        setCurrentParam(prev => ({ ...prev, [name]: e.value }));
        // If type changes, reset the values field
        if (name === 'param_type_id') {
            setComponentValue(null);
            setCurrentParam(prev => ({ ...prev, values: "{}" }));
        }
    };

    const onDetailSwitchChange = (e: InputSwitchChangeEvent, name: keyof ReportParamResponse) => {
        setCurrentParam(prev => ({ ...prev, [name]: e.value }));
    };

    // Handler for the advanced value components
    const onValueChange = (e: any, isRange: boolean = false) => {
        const newValue = e.value;
        setComponentValue(newValue);
        if (currentParam) {
            const formattedString = formatValuesToString(newValue, currentParam.param_type_id!, isRange);
            setCurrentParam(prev => ({ ...prev, values: formattedString as any }));
        }
    };

    const leftToolbarTemplate = () => (
        <Button label={t('reports.addParameters')} icon="pi pi-plus" severity="success" onClick={openNew} />
    );

    const actionBodyTemplate = (rowData: ReportParamResponse) => (
        <>
            <Button icon="pi pi-pencil" rounded outlined className="mr-2" onClick={() => editParam(rowData)} />
            <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmDeleteParam(rowData)} />
        </>
    );

    const paramTypeBodyTemplate = (rowData: ReportParamResponse) => {
        return paramTypes.find(pt => pt.id === rowData.param_type_id)?.name || 'Unknown';
    };

    const enabledBodyTemplate = (rowData: ReportParamResponse) => {
        return <i className={classNames('pi', { 'pi-check-circle text-green-500': rowData.is_enabled, 'pi-times-circle text-red-500': !rowData.is_enabled })}></i>;
    };

    const paramDetailDialogFooter = (
        <>
            <Button label={t('actions.cancel')} icon="pi pi-times" outlined onClick={hideDetailDialog} />
            <Button label={t('actions.save')} icon="pi pi-check" onClick={saveParam} />
        </>
    );

    const renderValueInput = () => {
        if (!currentParam) return null;

        const { param_type_id } = currentParam;

        switch (param_type_id) {
            case 1: // Numeric
                // InputNumber is for single values. For lists/ranges, InputText is simpler.
                // For a better UX, you could implement a custom component with two InputNumbers for range.
                return (
                    <InputText id="values" value={Array.isArray(currentParam.values) ? currentParam.values.join(',') : (currentParam.values || '')} onChange={(e) => onDetailInputChange(e, 'values')} placeholder="{1,2,3} or {1...100}" />
                );
            case 2: // String
                return (
                    <Chips id="values" value={componentValue} onChange={(e: ChipsChangeEvent) => onValueChange(e)} separator="," placeholder="Enter values and press Enter" />
                );
            case 3: // Date
                return (
                    <Calendar
                        id="values"
                        value={componentValue}
                        onChange={(e) => onValueChange(e, Array.isArray(e.value) && e.value.length === 2)}
                        selectionMode="range"
                        dateFormat="yy/mm/dd"
                        placeholder="Select a date or range"
                        showIcon
                    />
                );
            case 4: // Datetime
                return (
                    <Calendar
                        id="values"
                        value={componentValue}
                        onChange={(e) => onValueChange(e, Array.isArray(e.value) && e.value.length === 2)}
                        selectionMode="range"
                        dateFormat="yy/mm/dd"
                        showTime
                        showSeconds
                        placeholder="Select a datetime or range"
                        showIcon
                    />
                );
            case 5: // Boolean
                // For booleans, a simple text input is often sufficient for the required format.
                return <InputText id="values" value={Array.isArray(currentParam.values) ? currentParam.values.join(',') : (currentParam.values || '')} onChange={(e) => onDetailInputChange(e, 'values')} placeholder="{true,false}" />;
            default:
                return <InputText id="values" value={Array.isArray(currentParam.values) ? currentParam.values.join(',') : (currentParam.values || '')} onChange={(e) => onDetailInputChange(e, 'values')} />;
        }
    };

    return (
        <Dialog visible={visible} style={{ width: '50rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header={` ${t('reports.parametersFor')}: ${report?.name}`} modal onHide={onHide}>
            <Toast ref={toast} />
            <div className="card">
                <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>

                <DataTable value={params} dataKey="id" emptyMessage={t('reports.noParametersFound')}>
                    <Column field="name" header={t('common.name')} sortable style={{ minWidth: '12rem' }}></Column>
                    <Column field="param_type_id" header={t('reports.paramType')} body={paramTypeBodyTemplate} sortable style={{ minWidth: '8rem' }}></Column>
                    <Column field="values" header={t('reports.posibleValues')} style={{ minWidth: '15rem' }}></Column>
                    <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '8rem' }}></Column>
                </DataTable>
            </div>

            {/* --- Add/Edit Parameter Dialog --- */}
            <Dialog visible={paramDetailDialog} style={{ width: '32rem' }} header="Parameter Details" modal className="p-fluid" footer={paramDetailDialogFooter} onHide={hideDetailDialog}>
                <div className="field">
                    <label htmlFor="name" className="font-bold">{t('common.name')}</label>
                    <InputText id="name" value={currentParam?.name || ''} onChange={(e) => onDetailInputChange(e, 'name')} required autoFocus className={classNames({ 'p-invalid': submitted && !currentParam?.name })} />
                    {submitted && !currentParam?.name && <small className="p-error">Name is required.</small>}
                </div>

                <div className="field">
                    <label htmlFor="param_type_id" className="font-bold">{t('reports.paramType')}</label>
                    <Dropdown id="param_type_id" value={currentParam?.param_type_id} options={paramTypes} onChange={(e) => onDetailDropdownChange(e, 'param_type_id')} optionLabel="name" optionValue="id" placeholder="Select a Type" />
                </div>

                <div className="field">
                    <label htmlFor="values" className="font-bold">{t('reports.posibleValues')}</label>
                    {renderValueInput()}
                    <small>{t('reports.descriptionValues')}, `{"{val1,val2}"}` or `{"{start...end}"}`.</small>
                </div>

                <div className="field flex justify-content-between align-items-center">
                    <label htmlFor="is_enabled" className="font-bold">{t('reports.enabled')}</label>
                    <InputSwitch id="is_enabled" checked={currentParam?.is_enabled ?? false} onChange={(e) => onDetailSwitchChange(e, 'is_enabled')} />
                </div>
            </Dialog>
        </Dialog>
    );
};