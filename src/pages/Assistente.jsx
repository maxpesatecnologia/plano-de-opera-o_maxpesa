import React, { useMemo, useState } from 'react';
import { Bot, Send } from 'lucide-react';
import { usePlano } from '../context/PlanoContext';
import { formatCurrency, formatDate } from '../lib/formatters';

const PERGUNTAS_RAPIDAS = [
  'Qual cliente gera mais receita?',
  'Quais contratos vencem este mês?',
  'Qual gerente possui maior faturamento?',
  'Quais equipamentos estão parados?',
  'Quanto falta faturar?',
];

function groupSum(items, keyFn, valueFn) {
  const map = new Map();
  items.forEach((item) => {
    const key = keyFn(item);
    if (!key) return;
    map.set(key, (map.get(key) || 0) + (Number(valueFn(item)) || 0));
  });
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

function responder(pergunta, { planos, equipamentos }) {
  const p = pergunta.toLowerCase();

  if (p.includes('cliente') && p.includes('receita')) {
    const ranking = groupSum(planos, (x) => x.cliente?.nome, (x) => x.receita);
    if (!ranking.length) return 'Ainda não há planos cadastrados com receita.';
    const [nome, valor] = ranking[0];
    return `${nome} é o cliente com maior receita: ${formatCurrency(valor)}.`;
  }

  if (p.includes('vencem') || (p.includes('contrato') && p.includes('mês'))) {
    const hoje = new Date();
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    const vencendo = planos.filter((x) => {
      const t = x.termino_ajustado ? new Date(x.termino_ajustado) : null;
      return t && t >= hoje && t <= fimMes;
    });
    if (!vencendo.length) return 'Nenhum contrato vence este mês.';
    return `${vencendo.length} contrato(s) vencem este mês: ${vencendo.map((x) => `${x.cliente?.nome} (${formatDate(x.termino_ajustado)})`).join(', ')}.`;
  }

  if (p.includes('gerente') && (p.includes('faturamento') || p.includes('receita'))) {
    const ranking = groupSum(planos, (x) => x.gerente?.nome, (x) => x.receita);
    if (!ranking.length) return 'Nenhum gerente com planos cadastrados ainda.';
    const [nome, valor] = ranking[0];
    return `${nome} é o gerente com maior faturamento: ${formatCurrency(valor)}.`;
  }

  if (p.includes('equipamento') && p.includes('parado')) {
    const parados = equipamentos.filter((e) => e.status === 'parado');
    if (!parados.length) return 'Nenhum equipamento está parado atualmente.';
    return `${parados.length} equipamento(s) parado(s): ${parados.map((e) => e.placa || e.tipo).join(', ')}.`;
  }

  if (p.includes('falta faturar') || (p.includes('falta') && p.includes('fatur'))) {
    const previsto = planos.reduce((acc, x) => acc + (Number(x.projecao_anual) || 0), 0);
    const faturado = planos.flatMap((x) => x.faturamentos || []).reduce((acc, f) => acc + (Number(f.valor) || 0), 0);
    return `Falta faturar ${formatCurrency(previsto - faturado)} (previsto ${formatCurrency(previsto)}, faturado ${formatCurrency(faturado)}).`;
  }

  return 'Ainda não sei responder essa pergunta com as regras locais. As perguntas de exemplo abaixo já funcionam — outras perguntas em linguagem livre exigem conectar este assistente à API da Claude via uma função de backend (pendente, ver observações abaixo).';
}

export default function Assistente() {
  const { planos, equipamentos } = usePlano();
  const [pergunta, setPergunta] = useState('');
  const [historico, setHistorico] = useState([]);

  const contexto = useMemo(() => ({ planos, equipamentos }), [planos, equipamentos]);

  const perguntar = (texto) => {
    if (!texto.trim()) return;
    const resposta = responder(texto, contexto);
    setHistorico((h) => [...h, { pergunta: texto, resposta }]);
    setPergunta('');
  };

  return (
    <div>
      <div className="page-header"><h1>Assistente IA</h1></div>

      <div className="panel" style={{ marginBottom: '1rem' }}>
        <div className="flex gap-2" style={{ marginBottom: '1rem' }}>
          <input
            style={{ flex: 1, padding: '0.7rem 1rem', borderRadius: 8, border: '1px solid var(--border-color)' }}
            placeholder="Pergunte sobre clientes, gerentes, equipamentos, faturamento..."
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && perguntar(pergunta)}
          />
          <button className="btn-primary" onClick={() => perguntar(pergunta)}><Send size={16} /></button>
        </div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          {PERGUNTAS_RAPIDAS.map((q) => (
            <button key={q} className="btn-secondary" onClick={() => perguntar(q)}>{q}</button>
          ))}
        </div>
      </div>

      <div className="panel">
        {historico.length === 0 ? (
          <div className="empty-state">
            <Bot size={32} style={{ marginBottom: '0.5rem' }} />
            <p>Faça uma pergunta ou use um dos atalhos acima.</p>
          </div>
        ) : (
          historico.map((h, i) => (
            <div key={i} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--column-bg)' }}>
              <p style={{ fontWeight: 700 }}>{h.pergunta}</p>
              <p className="text-muted" style={{ marginTop: '0.3rem' }}>{h.resposta}</p>
            </div>
          ))
        )}
      </div>

      <p className="text-muted text-xs" style={{ marginTop: '1rem' }}>
        Este assistente responde hoje com regras locais sobre os dados carregados (sem custo de API e sem expor dados a terceiros).
        Para perguntas em linguagem totalmente livre, o próximo passo é enviar os dados já agregados aqui para a API da Claude
        através de uma função de backend — não deve ser feito direto do navegador para não expor a chave de API.
      </p>
    </div>
  );
}
