import React, { useMemo } from 'react';
import { usePlano } from '../context/PlanoContext';
import { parseDate } from '../lib/formatters';
import './Timeline.css';

const STEPS = ['Início', 'Medição', 'Aprovação', 'Emissão NF', 'Pagamento'];

function computeStages(plano) {
  const hoje = new Date();
  const medicao = (plano.medicoes || [])[0];
  const faturamento = (plano.faturamentos || [])[0];

  const inicio = parseDate(plano.inicio_ajustado);
  const stageInicio = inicio && inicio <= hoje ? 'concluido' : 'andamento';

  let stageMedicao = 'andamento';
  if (medicao) {
    if (medicao.status === 'aprovada') stageMedicao = 'concluido';
    else if (medicao.status === 'atrasada' || (parseDate(medicao.data_medicao) && parseDate(medicao.data_medicao) < hoje)) stageMedicao = 'atrasado';
  }

  let stageAprovacao = 'andamento';
  if (medicao?.aprovado_em) stageAprovacao = 'concluido';
  else if (stageMedicao === 'atrasado') stageAprovacao = 'atrasado';

  let stageNf = 'andamento';
  if (plano.numero_nf) stageNf = 'concluido';
  else if (stageAprovacao === 'concluido') stageNf = 'atrasado'; // aprovado mas NF ainda não emitida

  let stagePagamento = 'andamento';
  if (faturamento?.data_pagamento) stagePagamento = 'concluido';
  else if (stageNf !== 'concluido') stagePagamento = 'andamento';

  return [stageInicio, stageMedicao, stageAprovacao, stageNf, stagePagamento];
}

export default function Timeline() {
  const { planos, loading, buscaGlobal } = usePlano();
  const ativos = useMemo(() => {
    const busca = buscaGlobal.trim().toLowerCase();
    return planos
      .filter((p) => p.status_fatura !== 'faturado')
      .filter((p) => {
        if (!busca) return true;
        const alvo = [p.cliente?.nome, p.numero_plano, p.equipamento?.placa].join(' ').toLowerCase();
        return alvo.includes(busca);
      })
      .slice(0, 50);
  }, [planos, buscaGlobal]);

  if (loading) return <div className="empty-state">Carregando...</div>;

  return (
    <div>
      <div className="page-header"><h1>Timeline</h1></div>
      {ativos.length === 0 ? (
        <div className="empty-state">Nenhum plano em andamento.</div>
      ) : (
        ativos.map((p) => {
          const stages = computeStages(p);
          return (
            <div key={p.id} className="timeline-row">
              <div className="timeline-row-header">
                <strong>{p.cliente?.nome} — Plano {p.numero_plano}</strong>
                <span className="text-muted">{p.obra?.nome}</span>
              </div>
              <div className="timeline-steps">
                {STEPS.map((label, i) => (
                  <div key={label} className={`timeline-step status-${stages[i]}`}>
                    <div className="line" />
                    <div className="dot" />
                    <span className="label">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
