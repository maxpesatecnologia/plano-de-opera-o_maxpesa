import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Upload, FileDown, FileSpreadsheet, FileText, Pencil, Trash2, Eye, Copy, AlertTriangle,
} from 'lucide-react';
import { usePlano } from '../context/PlanoContext';
import { formatCurrency, formatDate, parseDate } from '../lib/formatters';
import { computeAlertas } from '../lib/kpis';
import { exportPlanosToExcel } from '../lib/excelParser';
import { exportPlanosToCsv, exportPlanosToPdf } from '../lib/exporters';
import ImportPlanosModal from '../components/plano/ImportPlanosModal';
import ViewPlanoModal from '../components/plano/ViewPlanoModal';

const STATUS_LABELS = {
  faturado: 'Faturado',
  pendente: 'Pendente',
  em_aprovacao: 'Em Aprovação',
  em_medicao: 'Em Medição',
  atrasado: 'Atrasado',
};

export default function PlanoOperacao() {
  const { planos, clientes, gerentes, equipamentos, deletePlano, duplicatePlano, loading } = usePlano();
  const navigate = useNavigate();

  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState({ cliente: '', gerente: '', equipamento: '', cidade: '', status: '', mes: '', ano: '' });
  const [showImport, setShowImport] = useState(false);
  const [viewPlano, setViewPlano] = useState(null);

  const cidades = useMemo(() => [...new Set(planos.map((p) => p.obra?.cidade).filter(Boolean))], [planos]);

  const filtrados = useMemo(() => {
    return planos.filter((p) => {
      if (filtros.cliente && p.cliente_id !== filtros.cliente) return false;
      if (filtros.gerente && p.gerente_id !== filtros.gerente) return false;
      if (filtros.equipamento && p.equipamento_id !== filtros.equipamento) return false;
      if (filtros.cidade && p.obra?.cidade !== filtros.cidade) return false;
      if (filtros.status && p.status_fatura !== filtros.status) return false;
      const inicio = parseDate(p.inicio_ajustado);
      if (filtros.mes && inicio && inicio.getUTCMonth() + 1 !== Number(filtros.mes)) return false;
      if (filtros.ano && inicio && inicio.getUTCFullYear() !== Number(filtros.ano)) return false;

      if (busca) {
        const alvo = [
          p.cliente?.nome, p.numero_plano, p.equipamento?.placa, p.equipamento?.tipo,
          p.gerente?.nome, p.obra?.nome, p.numero_nf, p.observacoes,
        ].join(' ').toLowerCase();
        if (!alvo.includes(busca.toLowerCase())) return false;
      }
      return true;
    });
  }, [planos, filtros, busca]);

  const anos = useMemo(() => {
    const set = new Set(planos.map((p) => parseDate(p.inicio_ajustado)?.getUTCFullYear()).filter(Boolean));
    return [...set].sort();
  }, [planos]);

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

      <div className="filter-bar">
        <div className="search-input">
          <Search size={16} />
          <input placeholder="Pesquisar qualquer informação..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <select value={filtros.cliente} onChange={(e) => setFiltros((f) => ({ ...f, cliente: e.target.value }))}>
          <option value="">Cliente (todos)</option>
          {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <select value={filtros.gerente} onChange={(e) => setFiltros((f) => ({ ...f, gerente: e.target.value }))}>
          <option value="">Gerente (todos)</option>
          {gerentes.map((g) => <option key={g.id} value={g.id}>{g.nome}</option>)}
        </select>
        <select value={filtros.equipamento} onChange={(e) => setFiltros((f) => ({ ...f, equipamento: e.target.value }))}>
          <option value="">Equipamento (todos)</option>
          {equipamentos.map((e) => <option key={e.id} value={e.id}>{e.placa || e.tipo}</option>)}
        </select>
        <select value={filtros.cidade} onChange={(e) => setFiltros((f) => ({ ...f, cidade: e.target.value }))}>
          <option value="">Cidade (todas)</option>
          {cidades.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filtros.status} onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))}>
          <option value="">Status (todos)</option>
          {Object.entries(STATUS_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
        <select value={filtros.mes} onChange={(e) => setFiltros((f) => ({ ...f, mes: e.target.value }))}>
          <option value="">Mês (todos)</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filtros.ano} onChange={(e) => setFiltros((f) => ({ ...f, ano: e.target.value }))}>
          <option value="">Ano (todos)</option>
          {anos.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

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
                    <td><span className={`badge badge-${p.status_fatura}`}>{STATUS_LABELS[p.status_fatura] || p.status_fatura}</span></td>
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
