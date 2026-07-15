import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { usePlano } from '../context/PlanoContext';
import { computeIndicadores } from '../lib/kpis';
import { formatCurrency, formatPercent } from '../lib/formatters';

function groupSum(items, keyFn, valueFn) {
  const map = new Map();
  items.forEach((item) => {
    const key = keyFn(item) || 'Não informado';
    map.set(key, (map.get(key) || 0) + (Number(valueFn(item)) || 0));
  });
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

export default function Executivo() {
  const { planos, loading } = usePlano();
  const kpis = useMemo(() => computeIndicadores(planos), [planos]);

  const receitaMensal = useMemo(() => {
    const faturamentos = planos.flatMap((p) => p.faturamentos || []);
    const map = new Map();
    faturamentos.forEach((f) => {
      if (!f.data_emissao) return;
      const mes = f.data_emissao.slice(0, 7);
      map.set(mes, (map.get(mes) || 0) + (Number(f.valor) || 0));
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([mes, valor]) => ({ mes, valor }));
  }, [planos]);

  const topClientes = useMemo(() => groupSum(planos, (p) => p.cliente?.nome, (p) => p.receita).sort((a, b) => b.value - a.value).slice(0, 5), [planos]);
  const topEquipamentos = useMemo(() => groupSum(planos, (p) => p.equipamento?.placa || p.equipamento?.tipo, (p) => p.receita).sort((a, b) => b.value - a.value).slice(0, 5), [planos]);
  const topGerentes = useMemo(() => groupSum(planos, (p) => p.gerente?.nome, (p) => p.receita).sort((a, b) => b.value - a.value).slice(0, 5), [planos]);

  const obrasComReceita = useMemo(() => {
    const map = new Map();
    planos.forEach((p) => {
      if (!p.obra?.lat || !p.obra?.lng) return;
      const existing = map.get(p.obra.id) || { ...p.obra, receita: 0 };
      existing.receita += Number(p.receita) || 0;
      map.set(p.obra.id, existing);
    });
    return Array.from(map.values());
  }, [planos]);

  const metaVsRealizado = useMemo(() => {
    const mesAtual = new Date().getMonth() + 1;
    const meta = planos.reduce((acc, p) => acc + (Number(p.projecao_anual) || 0) * (mesAtual / 12), 0);
    return { meta, realizado: kpis.receitaFaturada };
  }, [planos, kpis.receitaFaturada]);

  if (loading) return <div className="empty-state">Carregando...</div>;

  return (
    <div>
      <div className="page-header"><h1>Dashboard Executivo</h1></div>

      <div className="kpi-grid">
        <Kpi label="Receita Total" value={formatCurrency(kpis.receitaFaturada + kpis.receitaEmAberto)} />
        <Kpi label="Receita Faturada" value={formatCurrency(kpis.receitaFaturada)} variant="success" />
        <Kpi label="Projeção" value={formatCurrency(kpis.receitaPrevista)} variant="info" />
        <Kpi label="Margem" value={formatPercent(kpis.margem)} variant={kpis.margem >= 0 ? 'success' : 'danger'} />
      </div>

      <div className="charts-grid">
        <div className="chart-panel">
          <h3>Evolução Mensal da Receita</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={receitaMensal}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => formatCurrency(v, { abbreviate: true })} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Line type="monotone" dataKey="valor" stroke="#E30613" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-panel">
          <h3>Meta x Realizado (mês, pró-rata da projeção anual)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={[{ name: 'Mês atual', ...metaVsRealizado }]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => formatCurrency(v, { abbreviate: true })} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="meta" name="Meta" fill="#3182CE" radius={[4, 4, 0, 0]} />
              <Bar dataKey="realizado" name="Realizado" fill="#38A169" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <RankingPanel title="Top Clientes" data={topClientes} />
        <RankingPanel title="Top Equipamentos" data={topEquipamentos} />
        <RankingPanel title="Top Gerentes" data={topGerentes} />

        <div className="chart-panel">
          <h3>Mapa das Obras</h3>
          {obrasComReceita.length > 0 ? (
            <MapContainer center={[-14.235, -51.9253]} zoom={4} style={{ height: 260, borderRadius: 8 }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
              {obrasComReceita.map((o) => (
                <CircleMarker key={o.id} center={[o.lat, o.lng]} radius={Math.min(30, 6 + Math.sqrt(o.receita) / 200)} color="#E30613" fillOpacity={0.5}>
                  <LeafletTooltip>{o.nome} — {formatCurrency(o.receita)}</LeafletTooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          ) : (
            <div className="empty-state">Nenhuma obra com coordenadas cadastradas.</div>
          )}
        </div>
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

function RankingPanel({ title, data }) {
  const max = data[0]?.value || 1;
  return (
    <div className="chart-panel">
      <h3>{title}</h3>
      {data.length === 0 ? <p className="text-muted">Sem dados.</p> : (
        <div className="flex flex-col gap-2">
          {data.map((d, i) => (
            <div key={d.name} style={{ fontSize: '0.82rem' }}>
              <div className="flex justify-between"><span>{i + 1}. {d.name}</span><strong>{formatCurrency(d.value, { abbreviate: true })}</strong></div>
              <div style={{ height: 6, background: 'var(--column-bg)', borderRadius: 3, marginTop: 3 }}>
                <div style={{ height: '100%', width: `${(d.value / max) * 100}%`, background: '#E30613', borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
