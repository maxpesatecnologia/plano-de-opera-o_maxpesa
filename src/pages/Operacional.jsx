import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { usePlano } from '../context/PlanoContext';
import { formatCurrency, formatDate } from '../lib/formatters';

const STATUS_LABELS = {
  disponivel: 'Disponível',
  operacao: 'Em Operação',
  mobilizacao: 'Mobilização',
  desmobilizacao: 'Desmobilização',
  parado: 'Parado',
  manutencao: 'Manutenção',
};

const STATUS_COLORS = {
  disponivel: 'success',
  operacao: 'info',
  mobilizacao: 'warning',
  desmobilizacao: 'warning',
  parado: 'danger',
  manutencao: 'danger',
};

export default function Operacional() {
  const { equipamentos, planos, loading } = usePlano();
  const [selecionado, setSelecionado] = useState(null);

  const porStatus = useMemo(() => {
    const groups = {};
    Object.keys(STATUS_LABELS).forEach((s) => { groups[s] = []; });
    equipamentos.forEach((e) => {
      const s = e.status || 'disponivel';
      if (!groups[s]) groups[s] = [];
      groups[s].push(e);
    });
    return groups;
  }, [equipamentos]);

  const historicoEquipamento = useMemo(() => {
    if (!selecionado) return [];
    return planos.filter((p) => p.equipamento_id === selecionado.id);
  }, [selecionado, planos]);

  if (loading) return <div className="empty-state">Carregando...</div>;

  return (
    <div>
      <div className="page-header"><h1>Operacional</h1></div>

      <div className="kpi-grid">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} className={`kpi-card ${STATUS_COLORS[key]}`}>
            <span className="kpi-label">{label}</span>
            <span className="kpi-value">{porStatus[key]?.length || 0}</span>
          </div>
        ))}
      </div>

      {equipamentos.length === 0 ? (
        <div className="empty-state">Nenhum equipamento cadastrado ainda. Cadastre um plano com placa/equipamento para popular esta tela.</div>
      ) : (
        <div className="charts-grid">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            porStatus[key]?.length > 0 && (
              <div key={key} className="chart-panel">
                <h3>{label}</h3>
                <div className="flex flex-col gap-2">
                  {porStatus[key].map((e) => (
                    <button
                      key={e.id}
                      className="btn-secondary"
                      style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                      onClick={() => setSelecionado(e)}
                    >
                      {e.placa || e.tipo || 'Equipamento sem identificação'}
                    </button>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {selecionado && (
        <div className="modal-overlay" onClick={() => setSelecionado(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selecionado.placa || selecionado.tipo}</h2>
              <button className="btn-ghost" onClick={() => setSelecionado(null)}><X size={20} /></button>
            </div>
            <p className="text-muted text-sm" style={{ marginBottom: '1rem' }}>
              Status atual: <strong>{STATUS_LABELS[selecionado.status] || selecionado.status}</strong>
            </p>
            {historicoEquipamento.length === 0 ? (
              <div className="empty-state">Nenhum plano associado a este equipamento.</div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Cliente</th><th>Nº Plano</th><th>Início</th><th>Término</th><th>Receita</th></tr></thead>
                  <tbody>
                    {historicoEquipamento.map((p) => (
                      <tr key={p.id}>
                        <td>{p.cliente?.nome}</td>
                        <td>{p.numero_plano}</td>
                        <td>{formatDate(p.inicio_ajustado)}</td>
                        <td>{formatDate(p.termino_ajustado)}</td>
                        <td>{formatCurrency(p.receita)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
