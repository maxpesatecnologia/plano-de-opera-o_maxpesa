import React, { useRef, useState } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle, Loader2, Download } from 'lucide-react';
import { parsePlanoExcel, generatePlanoTemplate } from '../../lib/excelParser';
import { formatCurrency } from '../../lib/formatters';
import { usePlano } from '../../context/PlanoContext';

export default function ImportPlanosModal({ onClose }) {
  const { bulkImportPlanos, importing } = usePlano();
  const [step, setStep] = useState('upload'); // upload | preview | done
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    try {
      const parsed = await parsePlanoExcel(file);
      setRows(parsed);
      setStep('preview');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleImport = async () => {
    try {
      const n = await bulkImportPlanos(rows);
      setCount(n);
      setStep('done');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={step !== 'done' ? onClose : undefined}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={22} color="#E30613" />
            <h2>Importar Planilha de Operação</h2>
          </div>
          <button className="btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>

        {step === 'upload' && (
          <div>
            <div
              onClick={() => fileRef.current.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
              style={{
                border: '2px dashed var(--border-color)', borderRadius: '12px', padding: '3rem',
                textAlign: 'center', cursor: 'pointer', background: 'var(--bg-color)',
              }}
            >
              <Upload size={40} color="#E30613" style={{ marginBottom: '0.75rem' }} />
              <p style={{ fontWeight: 700, marginBottom: '0.3rem' }}>Clique ou arraste a planilha aqui</p>
              <p className="text-muted text-sm">Formatos aceitos: .xlsx, .xls, .csv</p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
            </div>
            <p className="text-muted text-sm" style={{ marginTop: '1rem' }}>
              As colunas são detectadas automaticamente pelo nome (Cliente, Placa, Gerente, Receita, etc.) — não é necessário configurar nada.
            </p>
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <button className="btn-secondary" onClick={generatePlanoTemplate}>
                <Download size={16} /> Baixar planilha modelo
              </button>
            </div>
            {error && <p style={{ color: '#c53030', marginTop: '1rem' }}>{error}</p>}
          </div>
        )}

        {step === 'preview' && (
          <div>
            <p className="text-muted" style={{ marginBottom: '1rem' }}>
              <strong style={{ color: 'var(--text-main)' }}>{rows.length}</strong> registros detectados. Prévia dos primeiros 5:
            </p>
            <div className="table-wrapper" style={{ marginBottom: '1.25rem' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cliente</th><th>Nº Plano</th><th>Placa</th><th>Gerente</th><th>Receita</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((r, i) => (
                    <tr key={i}>
                      <td>{r.cliente || '—'}</td>
                      <td>{r.numeroPlano || '—'}</td>
                      <td>{r.placa || '—'}</td>
                      <td>{r.gerente || '—'}</td>
                      <td>{formatCurrency(r.receita)}</td>
                      <td>{r.statusFatura}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {error && <p style={{ color: '#c53030', marginBottom: '1rem' }}>{error}</p>}
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setStep('upload')} disabled={importing}>Voltar</button>
              <button className="btn-primary" onClick={handleImport} disabled={importing}>
                {importing ? <><Loader2 size={16} className="spin" /> Importando...</> : `Importar ${rows.length} planos`}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <CheckCircle size={52} color="#38A169" style={{ marginBottom: '1rem' }} />
            <h3>Importação concluída!</h3>
            <p className="text-muted" style={{ margin: '0.5rem 0 1.5rem' }}>{count} planos importados com sucesso.</p>
            <button className="btn-primary" onClick={onClose}>Fechar</button>
          </div>
        )}
      </div>
    </div>
  );
}
