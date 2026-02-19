import React, { useEffect, useState, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useTranslation } from 'react-i18next';
import { reportService } from '../../services/reportService';
import { Report, ReportParam, ReportParamValue, RunReportResponse } from '../../types/report';

interface Props {
  visible: boolean;
  onHide: () => void;
  report: Report | null;
}

export const ReportTestDialog: React.FC<Props> = ({ visible, onHide, report }) => {
  const { t } = useTranslation();
  const [loadingParams, setLoadingParams] = useState(false);
  const [params, setParams] = useState<ReportParam[]>([]);
  const [selectedValues, setSelectedValues] = useState<ReportParamValue[]>([]);
  const [canRun, setCanRun] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setParams([]);
    setSelectedValues([]);
    setCanRun(false);
    setRunning(false);
    setResult(null);
    setError(null);
  };

  useEffect(() => {
    if (visible && report) {
      reset();
      setLoadingParams(true);
      reportService.getReportParam(report.id)
        .then(r => {
          const arr = Array.isArray(r.result) ? r.result : r.result ? [r.result] : [];
          setParams(arr);
          if (arr.length === 0) setCanRun(true);
        })
        .catch(e => setError(e?.message || 'Error'))
        .finally(() => setLoadingParams(false));
    } else if (!visible) {
      reset();
    }
  }, [visible, report]);

  const upsertValue = useCallback((paramId: number, type_id: number, value: string) => {
    setSelectedValues(prev => {
      const idx = prev.findIndex(v => v.id === paramId);
      const next = [...prev];
      if (idx !== -1) next[idx] = { ...next[idx], id: paramId, type_id, value, index: idx };
      else next.push({ id: paramId, type_id, value, index: next.length });
      if (next.length === params.length) setCanRun(true); else setCanRun(false);
      return next;
    });
  }, [params.length]);

  const handleRun = () => {
    if (!report) return;
    setRunning(true);
    setError(null);
    setResult(null);
    const payload = {
      id: report.id,
      tables_group_id: report.tables_group_id,
      name: report.name,
      prompt: report.prompt,
      query: report.query,
      params: params.map(p => ({
        id: p.id,
        name: p.name,
        type_id: p.type_id,
        value: selectedValues.find(v => v.id === p.id)?.value || '',
        possible_values: '{' + p.values.join(', ') + '}'
      }))
    };
    reportService.runReport(payload)
      .then(r => setResult(r.result))
      .catch(e => setError(e?.message || 'Error'))
      .finally(() => setRunning(false));
  };

  const renderParamInput = (p: ReportParam) => {
    const current = selectedValues.find(v => v.id === p.id);
    if (p.type_element === 'select') {
      return (
        <Dropdown
          value={current?.value}
          options={p.values.map(v => ({ label: v, value: v }))}
          placeholder={t('reports.selectValue')}
          onChange={(e) => upsertValue(p.id, p.type_id, String(e.value))}
        />
      );
    }
    if (p.type_element === 'free' && p.type_id === 1) {
      return (
        <InputNumber
          value={current?.value ? Number(current.value) : undefined}
            onValueChange={(e) => upsertValue(p.id, p.type_id, String(e.value ?? ''))}
        />
      );
    }
    if (p.type_element === 'free' && p.type_id === 2) {
      return (
        <InputText
          value={current?.value || ''}
          onChange={(e) => upsertValue(p.id, p.type_id, e.target.value)}
        />
      );
    }
    if (p.type_element === 'free' && p.type_id === 3) {
      return (
        <Calendar
          value={current?.value ? new Date(current.value) : undefined}
          onChange={(e) => {
            if (e.value) {
              const d = e.value as Date;
              const formatted = `${d.getFullYear()}/${String(d.getMonth() + 101).substring(1)}/${String(d.getDate() + 100).substring(1)}`;
              upsertValue(p.id, p.type_id, formatted);
            }
          }}
          dateFormat="yy/mm/dd"
          showIcon
        />
      );
    }
    return null;
  };

  const footer = (
    <div className="flex gap-2 justify-end">
      <Button label={t('common.close')} outlined onClick={onHide} />
      <Button label={t('reports.runTest')} icon="pi pi-play" disabled={!canRun || running} onClick={handleRun} />
    </div>
  );

  return (
    <Dialog
      header={t('reports.testExecution')}
      visible={visible}
      style={{ width: '70vw', maxWidth: 1000 }}
      modal
      onHide={onHide}
      footer={footer}
    >
      {!report && <div>{t('reports.noReportSelected')}</div>}

      {loadingParams && (
        <div className="flex justify-content-center py-5">
          <ProgressSpinner />
        </div>
      )}

      {!loadingParams && report && (
        <>
          <h4>{report.name}</h4>
          <p style={{ whiteSpace: 'pre-line' }}>{report.prompt}</p>
          {params.length > 0 && (
            <div className="grid" style={{ rowGap: '1rem' }}>
              {params.map((p) => (
                <div key={p.id} className="col-12 md:col-6">
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    {p.prompt_part}:
                  </label>
                  {renderParamInput(p)}
                </div>
              ))}
            </div>
          )}
          {params.length === 0 && (
            <div className="my-2">{t('reports.noParams')}</div>
          )}
        </>
      )}

      {running && (
        <div className="flex justify-content-center py-4">
          <ProgressSpinner />
        </div>
      )}

      {!running && error && (
        <div className="p-3 text-red-500">{error}</div>
      )}

      {!running && result && (
        <div className="mt-4">
          <div><b>{t('reports.totals')}:</b> {result.totals}</div>
          {result.attachs?.map((a, idx) => (
            <div key={idx}>
              <Button link icon={a.icono} label={a.name} onClick={() => {
                if (a.path) {
                  const url = a.path.startsWith('http') ? a.path : `${window.location.origin}/${a.path.replace(/^\/+/, '')}`;
                  window.open(url, '_blank', 'noopener,noreferrer');
                }
              }} />
            </div>
          ))}
          <div className="dataframe-container">
            {result.dataframe?.data
              ? <div dangerouslySetInnerHTML={{ __html: result.dataframe.data }} />
              : <i>{t('reports.noRecords')}</i>}
          </div>
        </div>
      )}
    </Dialog>
  );
};