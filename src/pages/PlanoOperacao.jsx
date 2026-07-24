import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileDown, FileSpreadsheet, FileText, Pencil, Trash2, Eye, Copy, AlertTriangle,
} from 'lucide-react';
import { usePlano } from '../context/PlanoContext';
import { formatCurrency, formatDate } from '../lib/formatters';
import { computeAlertas } from '../lib/kpis';
import { emptyFiltros, filtrarPlanos, STATUS_FILTRO_LABELS } from '../lib/planoFilters';
import { exportPlanosToExcel } from '../lib/excelParser';
import { exportPlanosToCsv, exportPlanosToPdf } from '../lib/exporters';
import ImportPlanosModal from '../components/plano/ImportPlanosModal';
import ViewPlanoModal from '../components/plano/ViewPlanoModal';
import FiltrosPlanos from '../components/plano/FiltrosPlanos';

export default function PlanoOperacao() {
  const { planos, clientes, gerentes, equipamentos, deletePlano, duplicatePlano, loading } = usePlano();
  const navigate = useNavigate();

  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState(emptyFiltros());
  const [showImport, setShowImport] = useState(false);
  const [viewPlano, setViewPlano] = useState(null);

  const filtrados = useMemo(() => filtrarPlanos(planos, filtros, busca), [planos, filtros, busca]);

  const handleDelete = async (plano) => {
    if (window.confirm(`Excluir o plano ${plano.numero_plano || plano.id}? Essa ação não pode ser desfeita.`)) {
      await deletePlano(plano.id);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Plano de Operação</h1>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setShowImport(true)}><Upload size={16} /> Importar Excel</button>
          <button className="btn-secondary" onClick={() => exportPlanosToExcel(filtrados)}><FileSpreadsheet size={16} /> Excel</button>
          <button className="btn-secondary" onClick={() => exportPlanosToCsv(filtrados)}><FileDown size={16} /> CSV</button>
          <button className="btn-secondary" onClick={() => exportPlanosToPdf(filtrados)}><FileText size={16} /> PDF</button>
          <button className="btn-primary" onClick={() => navigate('/cadastro')}>+ Novo Plano</button>
        </div>
      </div>

      <FiltrosPlanos
        planos={planos}
        clientes={clientes}
        gerentes={gerentes}
        equipamentos={equipamentos}
        filtros={filtros}
        setFiltros={setFiltros}
        busca={busca}
        setBusca={setBusca}
      />

      {loading ? (
        <div className="empty-state">Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div className="empty-state">Nenhum plano encontrado com esses filtros.</div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th><th>Nº Plano</th><th>Equipamento</th><th>Placa</th>
                <th>Gerente</th><th>Local</th><th>Início</th><th>Término</th><th>Dias</th>
                <th>Receita</th><th>Status</th><th>Projeção</th><th>Alertas</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => {
                const alertas = computeAlertas(p);
                return (
                  <tr key={p.id}>
                    <td>{p.cliente?.nome || '—'}</td>
                    <td>{p.numero_plano || '—'}</td>
                    <td>{p.equipamento?.tipo || '—'}</td>
                    <td>{p.equipamento?.placa || '—'}</td>
                    <td>{p.gerente?.nome || '—'}</td>
                    <td>{p.obra?.nome || '—'}</td>
                    <td>{formatDate(p.inicio_ajustado)}</td>
                    <td>{formatDate(p.termino_ajustado)}</td>
                    <td>{p.dias ?? '—'}</td>
                    <td>{formatCurrency(p.receita)}</td>
                    <td><span className={`badge badge-${p.status_fatura}`}>{STATUS_FILTRO_LABELS[p.status_fatura] || p.status_fatura}</span></td>
                    <td>{formatCurrency(p.projecao_anual)}</td>
                    <td>
                      {alertas.length > 0 && (
                        <span className="alert-chip" title={alertas.map((a) => a.label).join(', ')}>
                          <AlertTriangle size={11} /> {alertas.length}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn-ghost" title="Visualizar" onClick={() => setViewPlano(p)}><Eye size={16} /></button>
                        <button className="btn-ghost" title="Editar" onClick={() => navigate(`/cadastro/${p.id}`)}><Pencil size={16} /></button>
                        <button className="btn-ghost" title="Duplicar" onClick={() => duplicatePlano(p.id)}><Copy size={16} /></button>
                        <button className="btn-ghost" title="Excluir" onClick={() => handleDelete(p)}><Trash2 size={16} color="#E53E3E" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showImport && <ImportPlanosModal onClose={() => setShowImport(false)} />}
      {viewPlano && <ViewPlanoModal plano={viewPlano} onClose={() => setViewPlano(null)} />}
    </div>
  );
}
