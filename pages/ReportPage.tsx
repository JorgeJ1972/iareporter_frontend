import React, { useState, useCallback, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import './ReportPage.css';
import { useTranslation } from 'react-i18next';
import { useGlobal } from '../context/GlobalContext';
import { reportService } from '../services/reportService';
import { tablesGroupService } from '../services/tablesGroupService';
import { MessageUtils } from '../utils/MessageUtils';
import { ParamRun, Report, ReportParam, ReportParamValue, ReportParamValueExtended, RunReport, RunReportResponse } from '../types/report';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { TableGroup } from '../types/tableGroupt';



function ReportPage() {
  const { t } = useTranslation();
  const { toastRef, setBlocked } = useGlobal();
  const [environments, setEnvironmentUser] = useState<TableGroup[] | []>();
  const [reports, setReport] = useState<Report[] | []>();
  const [selectedEnvironment, setSelectedEnvironment] = useState<TableGroup | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportParams, setReportParam] = useState<ReportParam[] | []>([]);
  const [reportParamsExt, setReportParamExt] = useState<ReportParamValueExtended[] | []>([]);
  const [selectedValues, setSelectedValues] = useState<ReportParamValue[]>([]);
  const [selectedValue, setSelectedValue] = useState<string[] | []>([]);
  const [value, setValue] = useState<string[] | []>([]);
  const [resultsVisible, setResultsVisible] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);
  const [reportRun, setReportRun] = useState<RunReport | null>(null);
  const [paramRun, setParamRun] = useState<ParamRun | null>(null);
  const [runReportResponse, setRunReportResponse] = useState<RunReportResponse | null>(null);

  const handleInputChange = (paramId: string, type_id: number, value: string) => {
    let index_aux = selectedValues.findIndex(item => String(item['id']) === String(paramId));
    console.log("value Input:", value);
    if (index_aux !== -1) {
      selectedValues[index_aux] = { id: Number(paramId), index: index_aux, type_id, value };
    } else {
      index_aux = selectedValues.length;
      selectedValues.push({ id: Number(paramId), index: index_aux, type_id, value });
    }
    setSelectedValues([...selectedValues]);
    console.log("Selected Value After:", selectedValues);
    if (selectedValues.length === reportParams.length) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }
  const handleInputChangeDate = (paramId: string, type_id: number, value: Date) => {
    let index_aux = selectedValues.findIndex(item => String(item['id']) === String(paramId));
    const formattedDate = String(value.getFullYear()) + '/' + String(value.getMonth() + 101).substring(1) + '/' + String(value.getDate() + 100).substring(1);
    console.log("value Input:", formattedDate);
    
    if (index_aux !== -1) {
      selectedValues[index_aux] = { id: Number(paramId), index: index_aux, type_id, value:formattedDate };
    } else {
      index_aux = selectedValues.length;
      selectedValues.push({ id: Number(paramId), index: index_aux, type_id, value:formattedDate });
    }
    setSelectedValues([...selectedValues]);
    console.log("Selected Value After:", selectedValues);
    if (selectedValues.length === reportParams.length) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }
  
  const handleDropdownChange = (paramId: string,  type_id: number, value: string) => {
    //setSelectedValues({ id: Number(paramId), type_id, value });
    console.log("Selected Values Before:", selectedValues);

    let index_aux = selectedValues.findIndex(item => String(item['id']) === String(paramId));
    if (index_aux !== -1) {
      selectedValues[index_aux] = { id: Number(paramId), index: index_aux, type_id, value };
    } else {
      index_aux = selectedValues.length;
      selectedValues.push({ id: Number(paramId), index: index_aux, type_id, value });
    }
    console.log("Selected Value After:", selectedValues);
    setSelectedValues([...selectedValues]);
    console.log("number of paramms:", reportParams.length);
    if ((selectedValues.length === reportParams.length) || reportParams.length === 0) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  };

  const loadDatas = useCallback(async () => {
    setBlocked(true);
    try {
      const response = await tablesGroupService.getByUserId(1);
      const environmentsData: TableGroup[] = Array.isArray(response.result) ? response.result : [];
      setEnvironmentUser(environmentsData);
      // Establecer el primer entorno como seleccionado
      const firstEnvironment = environmentsData[0] || null;
      setSelectedEnvironment(firstEnvironment);

      // Luego obtener reportes usando el ID del primer entorno
      const allReports: Report[] = [];
      for (const environment of environmentsData) {
        const reportResponse = await reportService.getReportUser(environment.id);
        allReports.push(...(Array.isArray(reportResponse.result) ? reportResponse.result : reportResponse.result ? [reportResponse.result] : []));
      }
      setReport(allReports);
    } catch (error) {
      // Usamos el manejador centralizado que mostrará el error correcto.
      MessageUtils.handleApiError(toastRef, error, t('actions.loadUsers'));
      setEnvironmentUser([]); // Limpiar datos en caso de error para evitar mostrar información obsoleta.
    } finally {
      setBlocked(false);
    }
  }, [setBlocked, toastRef, t]); // Dependencias de useCallback 

  useEffect(() => {
    loadDatas();
  }, [loadDatas]);



  const handleOpenReport = (async (e: { value: Report | null; }) => {
    setSelectedReport(e.value ? e.value : null);
    setSelectedValues([]); // Limpiar valores seleccionados al abrir un nuevo reporte
    //setReportParamExt([]);
    setReportParam([]);
    setVisible(false);
    setResultsVisible(false);
    console.log("Selected Report State:", selectedReport);
    setBlocked(true);
    try {
      if (typeof e.value?.id === 'number') {
        const reportParamResponse = await reportService.getReportParam(e.value.id);
        setReportParam(Array.isArray(reportParamResponse.result) ? reportParamResponse.result : reportParamResponse.result ? [reportParamResponse.result] : []);
      } else {
        setReportParam([]);
      }
      console.log("number of params:", reportParams.length);
      if (reportParams.length === 0) {
        setVisible(true);
      } else {
        setVisible(false);
    }

    } catch (error) {
      // Usamos el manejador centralizado que mostrará el error correcto.
      MessageUtils.handleApiError(toastRef, error, t('actions.loadUsers'));
      setReportParam([]); // Limpiar datos en caso de error para evitar mostrar información obsoleta.
    }
    setBlocked(false);
  });


  const handleRunReport = (async (e: { value: Report | null; }) => {
    if (!selectedReport) {

      toastRef.current?.show({ severity: 'warn', summary: t('reports.noReportSelected'), detail: t('reports.selectReport'), life: 3000 });
      return;
    }
    setBlocked(true);
    setResultsVisible(true);
    try {
      // Aquí podrías implementar la lógica para ejecutar el reporte con los parámetros seleccionados
      console.log("Running report with parameters:", selectedValues);
      const runReport: RunReport = {
        id: selectedReport.id,
        tables_group_id: selectedReport.tables_group_id,
        name: selectedReport.name,
        prompt: selectedReport.prompt,
        query: selectedReport.query,
        params: reportParams.map(param => ({
          id: param.id,
          name: param.name,
          type_id: param.type_id,
          value: selectedValues.find(value => value.id === param.id)?.value || '',
          possible_values: "{" + param.values.join(', ') + "}",
        })),
      };
      console.log("Run Report Object:", runReport);
      const reportRunResponse = await reportService.runReport(runReport);
      setRunReportResponse(reportRunResponse.result || []);
      console.log("Run Report Response:", reportRunResponse);
      toastRef.current?.show({ severity: 'success', summary: t('reports.reportExecuted'), detail: t('reports.executionSuccess'), life: 3000 });
    } catch (error) {
      MessageUtils.handleApiError(toastRef, error, t('actions.runReport'));
    } finally {
      setBlocked(false);
    }
  });
  function handleDownload(path: string): void {
    if (!path) return;
    // If the path is a full URL, open in new tab. Otherwise, treat as relative path.
    const url = path.startsWith('http') ? path : `${window.location.origin}/${path.replace(/^\/+/, '')}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="report-page-layout">
      <Splitter style={{ width: '100%', height: '100%'}}>
        <SplitterPanel size={20} style={ {width: '20%', height: '100%' }}>  
          <div className="report-sidebar">
            <div className="sidebar-header">
              <p><b>{t('reports.title')}</b></p>
            </div>
            <div className="sidebar-header">
              <Accordion activeIndex={0}>
                {environments?.map((environment) => (
                  <AccordionTab key={environment.name} header={environment.name}>
                    {reports?.filter(report => report.tables_group_id === environment.id).map((report) => (
                      <Button
                        key={report.id}
                        label={report.name}
                        icon="pi pi-send"
                        className="p-button-sm report-button"
                        onClick={() => handleOpenReport({ value: report })} />
                    ))}
                    {reports?.filter(report => report.tables_group_id === environment.id).length === 0 && (
                      <p className="no-reports-message">{t('reports.noReports')}</p>
                    )}
                  </AccordionTab>
                ))}
              </Accordion>
            </div>
          </div>
        </SplitterPanel>
        <SplitterPanel size={80} style={ {width: '80%', height: '100%'}}>
        <div className="report-container">
          <div className="sidebar-header">
            <p><b>{t('reports.prompt')}</b></p>
          </div>
          <div className="flex-row-container">
            {reportParams.length === 0 && (
              <div className="no-params-message">
                {selectedReport?.prompt}
              </div>
            )}
            {reportParams?.map((param, index) => {
              // Remove the setSelectedValues call here; initialization should not be done in render.
              if (param.type_element === 'select') {
                return (
                  <div key={param.id}>
                    {param.prompt_part}:
                    <Dropdown
                      value={selectedValues[index]?.value}
                      options={param.values.map(value => ({ label: value, value }))}
                      onChange={(e) => handleDropdownChange(String(param.id), param.type_id, e.value)}
                      placeholder="Select a value" />
                  </div>
                );
              }
              else if (param.type_element === 'free' && param.type_id === 1) {
                return (
                  <div key={param.id}>{param.prompt_part}:
                  <InputNumber
                    value={selectedValues[index]?.value ? Number(selectedValues[0].value) : undefined}
                    onValueChange={(e) => handleInputChange(String(param.id), param.type_id, String(e.value ?? ''))}
                    min={selectedValues[0]?.value ? Number(selectedValues[0].value) : undefined}
                    max={selectedValues[1]?.value ? Number(selectedValues[1].value) : undefined}
                  />
                  </div>
                );
              }
              else if (param.type_element === 'free' && param.type_id === 2) {
                return (
                  <div key={param.id}>
                    {param.prompt_part}:
                  <InputText
                    value={selectedValues[index]?.value ?? undefined}
                    onChange={(e) => handleInputChange(String(param.id), param.type_id, String(e.target.value ?? ''))}
                    placeholder="text input"
                  />
                  </div>
                );
              }
              else if (param.type_element === 'free' && param.type_id === 3) {
                return (
                  <div key={param.id}>{param.prompt_part}: {selectedValues[index]?.value}
                  <Calendar
                    value={
                      selectedValues[index]?.value as string
                        ? new Date(selectedValues[index]?.value as string)
                        : undefined
                    }
                    onChange={(e) => {
                      if (e.value) {
                        handleInputChangeDate(String(param.id), param.type_id, new Date(e.value));
                      }
                    }}
                    placeholder="Enter Date value"
                    dateFormat="yy/mm/dd"
                    showIcon
                  />
                  </div>
                );
              }
            })}
          </div>
          {visible && (
          <div className="flex-row-container">
            <p><Button
              key={selectedReport?.id}
              label={t('reports.run')}
              icon="pi pi-file-excel"
              disabled={!selectedReport}
              visible={visible}
              className="p-button-sm button-primary"
              onClick={() => handleRunReport({ value: selectedReport })} /> </p>
          </div>
          )}
          {resultsVisible && (
            <div>
              <div className="flex-row-container">
                  <div className="report-results"><b>{t('reports.result')}</b></div>
                  <div>{t('reports.totals')}{runReportResponse?.totals}</div>
                  {runReportResponse?.attachs?.map((attach, index) => (
                    <div key={index} className="report-results">
                      <Button
                        link
                        label={attach.name}
                        icon={attach.icono}
                        onClick={() => handleDownload(attach.path)}
                      />
                    </div>
                  ))}
              </div>
              
              <div className="sidebar-header"> 
                {(runReportResponse?.totals ?? 0) > 100 ? (<b>{t('reports.top5')}</b>) : null} 
                {runReportResponse?.dataframe.data ? (
                  <div className="dataframe-container"
                    dangerouslySetInnerHTML={{ __html: runReportResponse.dataframe.data }} />
                ) : (
                  <p>{t('reports.noRecords')}</p>
                )}
                {(runReportResponse?.totals ?? 0) > 100 ? (<b>...</b>) : null}
              </div>
            </div>
          )}  
        </div>
        </SplitterPanel>
      </Splitter>
    </div>
  );
}
export default ReportPage;