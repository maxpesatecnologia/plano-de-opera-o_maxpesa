import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { computeAlertas, receitaDiaria, ticketMedio } from '../../lib/kpis';

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs text-muted font-medium" style={{ textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '0.9rem' }}>{value ?? '—'}</div>
    </div>
  );
}

export default function ViewPlanoModal({ plano, onClose }) {
  const alertas = computeAlertas(plano);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{plano.cliente?.nome} — Plano {plano.numero_plano}</h2>
          <button className="btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>

        {alertas.length > 0 && (
          <div style={{ background: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
            {alertas.map((a) => (
              <span key={a.tipo} className="alert-chip"><AlertTriangle size={11} /> {a.label}</span>
            ))}
          </div>
        )}

        <div className="form-section">
          <h3>Dados do Plano</h3>
          <div className="form-grid">
            <Field label="Cliente" value={plano.cliente?.nome} />
            <Field label="Gerente" value={plano.gerente?.nome} />
            <Field label="Local da Obra" value={plano.obra?.nome} />
            <Field label="Equipamento" value={plano.equipamento?.tipo} />
            <Field label="Placa" value={plano.equipamento?.placa} />
            <Field label="Início Ajustado" value={formatDate(plano.inicio_ajustado)} />
            <Field label="Término Ajustado" value={formatDate(plano.termino_ajustado)} />
            <Field label="Dias Operação (Ajustado)" value={plano.dias} />
            <Field label="Dias Operação (Original)" value={plano.dias_original} />
          </div>
        </div>

        <div className="form-section">
          <h3>Medição</h3>
          <div className="form-grid">
            <Field label="Vencimento da Medição" value={formatDate(plano.vencimento_medicao)} />
            <Field label="Data Envio Medição" value={formatDate(plano.data_envio_medicao)} />
            <Field label="Data Aprovação Medição" value={formatDate(plano.data_aprovacao_medicao)} />
            <Field label="Emitido Fatura?" value={plano.emitido_fatura ? 'Sim' : 'Não'} />
          </div>
        </div>

        <div className="form-section">
          <h3>Financeiro</h3>
          <div className="form-grid">
            <Field label="Receita" value={formatCurrency(plano.receita)} />
            <Field label="Projeção Anual" value={formatCurrency(plano.projecao_anual)} />
            <Field label="Crescimento" value={plano.crescimento != null ? `${plano.crescimento}%` : '—'} />
            <Field label="Valor Provisionado" value={formatCurrency(plano.valor_provisionado)} />
            <Field label="Receita Diária" value={formatCurrency(receitaDiaria(plano))} />
            <Field label="Ticket Médio (por hora)" value={formatCurrency(ticketMedio(plano))} />
            <Field label="Custo HS Terceiro" value={formatCurrency(plano.custo_hora_terceiro)} />
            <Field label="Valor de 3º a Pagar" value={formatCurrency(plano.custo_terceiro)} />
            <Field label="Status da Fatura" value={plano.status_fatura} />
            <Field label="Número NF" value={plano.numero_nf} />
            <Field label="Mês de Faturamento" value={plano.mes_faturamento} />
          </div>
        </div>

        {plano.observacoes && (
          <div className="form-section">
            <h3>Observações</h3>
            <p style={{ fontSize: '0.85rem' }}>{plano.observacoes}</p>
          </div>
        )}

        {(plano.faturamentos || []).length > 0 && (
          <div className="form-section">
            <h3>Faturamentos (NFs emitidas)</h3>
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>NF</th><th>Valor</th><th>Emissão</th><th>Pagamento</th><th>Status</th></tr></thead>
                <tbody>
                  {plano.faturamentos.map((f) => (
                    <tr key={f.id}>
                      <td>{f.numero_nf}</td>
                      <td>{formatCurrency(f.valor)}</td>
                      <td>{formatDate(f.data_emissao)}</td>
                      <td>{formatDate(f.data_pagamento)}</td>
                      <td>{f.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
