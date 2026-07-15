import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { usePlano } from '../context/PlanoContext';
import { computeIndicadores } from '../lib/kpis';
import { formatCurrency, formatPercent } from '../lib/formatters';

export default function Financeiro() {
  const { planos, loading } = usePlano();
  const kpis = useMemo(() => computeIndicadores(planos), [planos]);

  const receitaVsCustos = useMemo(() => {
    const map = new Map();
    planos.forEach((p) => {
      (p.faturamentos || []).forEach((f) => {
        if (!f.data_emissao) return;
        const mes = f.data_emissao.slice(0, 7);
        const entry = map.get(mes) || { mes, receita: 0, custo: 0 };
        entry.receita += Number(f.valor) || 0;
        map.set(mes, entry);
      });
      if (p.inicio_ajustado) {
        const mes = p.inicio_ajustado.slice(0, 7);
        const entry = map.get(mes) || { mes, receita: 0, custo: 0 };
        entry.custo += Number(p.custo_terceiro) || 0;
        map.set(mes, entry);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.mes.localeCompare(b.mes)).slice(-12);
  }, [planos]);

  if (loading) return <div className="empty-state">Carregando...</div>;

  return (
    <div>
      <div className="page-header"><h1>Financeiro</h1></div>

      <div className="kpi-grid">
        <Kpi label="Receita Prevista" value={formatCurrency(kpis.receitaPrevista)} />
        <Kpi label="Receita Faturada" value={formatCurrency(kpis.receitaFaturada)} variant="success" />
        <Kpi label="Receita Provisionada" value={formatCurrency(kpis.receitaProvisionada)} variant="info" />
        <Kpi label="Receita Perdida" value={formatCurrency(kpis.receitaPerdida)} variant="danger" />
        <Kpi label="Margem" value={formatPercent(kpis.margem)} variant={kpis.margem >= 0 ? 'success' : 'danger'} />
        <Kpi label="Custos de Terceiros" value={formatCurrency(kpis.custoTerceiros)} variant="warning" />
        <Kpi label="Lucro Operacional" value={formatCurrency(kpis.lucroOperacional)} variant={kpis.lucroOperacional >= 0 ? 'success' : 'danger'} />
      </div>

      <div className="chart-panel">
        <h3>Receita x Custos (mensal)</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={receitaVsCustos}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => formatCurrency(v, { abbreviate: true })} />
            <Tooltip formatter={(v) => formatCurrency(v)} />
            <Legend />
            <Bar dataKey="receita" name="Receita" fill="#38A169" radius={[4, 4, 0, 0]} />
            <Bar dataKey="custo" name="Custo de Terceiros" fill="#E30613" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Kpi({ label, value, variant }) {
  return (
    <div className={`kpi-card ${variant || ''}`}>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
    </div>
  );
}
