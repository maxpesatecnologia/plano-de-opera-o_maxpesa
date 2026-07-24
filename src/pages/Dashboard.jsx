import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { usePlano } from '../context/PlanoContext';
import { computeIndicadores } from '../lib/kpis';
import { formatCurrency } from '../lib/formatters';
import { emptyFiltros, filtrarPlanos } from '../lib/planoFilters';
import FiltrosPlanos from '../components/plano/FiltrosPlanos';
import './Dashboard.css';

const COLORS = ['#E30613', '#3182CE', '#FF6A00', '#38A169', '#805AD5', '#D69E2E'];

const STATUS_LABELS = {
  faturado: 'Faturado',
  pendente: 'Pendente',
  em_aprovacao: 'Em Aprovação',
  em_medicao: 'Em Medição',
  atrasado: 'Pendente',
};

function groupSum(items, keyFn, valueFn) {
  const map = new Map();
  items.forEach((item) => {
    const key = keyFn(item) || 'Não informado';
    map.set(key, (map.get(key) || 0) + (Number(valueFn(item)) || 0));
  });
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

export default function Dashboard() {
  const { planos, clientes, gerentes, equipamentos, loading } = usePlano();

  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState(emptyFiltros());

  const filtrados = useMemo(() => filtrarPlanos(planos, filtros, busca), [planos, filtros, busca]);

  const kpis = useMemo(() => computeIndicadores(filtrados), [filtrados]);

  const receitaPorCliente = useMemo(
    () => groupSum(filtrados, (p) => p.cliente?.nome, (p) => p.receita).sort((a, b) => b.value - a.value).slice(0, 12),
    [filtrados]
  );

  const receitaMensal = useMemo(() => {
    const faturamentos = filtrados.flatMap((p) => p.faturamentos || []);
    const map = new Map();
    faturamentos.forEach((f) => {
      if (!f.data_emissao) return;
      const mes = f.data_emissao.slice(0, 7); // yyyy-mm
      map.set(mes, (map.get(mes) || 0) + (Number(f.valor) || 0));
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([mes, valor]) => ({ mes, valor }));
  }, [filtrados]);

  const statusFaturas = useMemo(() => {
    const map = new Map();
    filtrados.forEach((p) => {
      const label = STATUS_LABELS[p.status_fatura] || 'Pendente';
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filtrados]);

  const receitaPorGerente = useMemo(
    () => groupSum(filtrados, (p) => p.gerente?.nome, (p) => p.receita).sort((a, b) => b.value - a.value).slice(0, 10),
    [filtrados]
  );

  const obrasComReceita = useMemo(() => {
    const map = new Map();
    filtrados.forEach((p) => {
      if (!p.obra?.lat || !p.obra?.lng) return;
      const key = p.obra.id;
      const existing = map.get(key) || { ...p.obra, receita: 0 };
      existing.receita += Number(p.receita) || 0;
      map.set(key, existing);
    });
    return Array.from(map.values());
  }, [filtrados]);

  const top10Clientes = useMemo(
    () => groupSum(filtrados, (p) => p.cliente?.nome, (p) => p.receita).sort((a, b) => b.value - a.value).slice(0, 10),
    [filtrados]
  );
  const maxTop10 = top10Clientes[0]?.value || 1;

  const totalEquipamentosFiltrados = useMemo(
    () => new Set(filtrados.map((p) => p.equipamento_id).filter(Boolean)).size,
    [filtrados]
  );
  const totalClientesFiltrados = useMemo(
    () => new Set(filtrados.map((p) => p.cliente_id).filter(Boolean)).size,
    [filtrados]
  );

  if (loading) return <div className="empty-state">Carregando dashboard...</div>;

  return (
    <div>
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

      <div className="kpi-grid">
        <KpiCard label="Total de Planos" value={kpis.totalPlanos} />
        <KpiCard label="Operações Ativas" value={kpis.operacoesAtivas} variant="success" />
        <KpiCard label="Operações Finalizadas" value={kpis.operacoesFinalizadas} variant="info" />
        <KpiCard label="Receita Prevista" value={formatCurrency(kpis.receitaPrevista, { abbreviate: true })} />
        <KpiCard label="Receita Faturada" value={formatCurrency(kpis.receitaFaturada, { abbreviate: true })} variant="success" />
        <KpiCard label="Receita em Aberto" value={formatCurrency(kpis.receitaEmAberto, { abbreviate: true })} variant="warning" />
        <KpiCard label="Valor Provisionado" value={formatCurrency(kpis.receitaProvisionada, { abbreviate: true })} variant="info" />
        <KpiCard label="Total de Equipamentos" value={totalEquipamentosFiltrados} />
        <KpiCard label="Total de Clientes" value={totalClientesFiltrados} />
      </div>

      {filtrados.length === 0 ? (
        <div className="empty-state">
          {planos.length === 0
            ? <>Nenhum plano cadastrado ainda. Use a tela <strong>Cadastro</strong> ou importe a planilha Excel em{' '}
              <strong>Plano de Operação</strong> para começar a ver os gráficos.</>
            : 'Nenhum plano encontrado com esses filtros.'}
        </div>
      ) : (
        <div className="charts-grid">
          <div className="chart-panel">
            <h3>Receita por Cliente</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={receitaPorCliente} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => formatCurrency(v, { abbreviate: true })} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="value" fill="#E30613" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-panel">
            <h3>Receita Mensal</h3>
            <ResponsiveContainer width="100%" height={280}>
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
            <h3>Status das Faturas</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={statusFaturas} dataKey="value" nameKey="name" outerRadius={95} label>
                  {statusFaturas.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-panel">
            <h3>Receita por Gerente de Contrato</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={receitaPorGerente}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => formatCurrency(v, { abbreviate: true })} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="value" fill="#3182CE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-panel">
            <h3>Receita por Local da Obra</h3>
            {obrasComReceita.length > 0 ? (
              <MapContainer center={[-14.235, -51.9253]} zoom={4} className="dashboard-map">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                {obrasComReceita.map((obra) => (
                  <CircleMarker
                    key={obra.id}
                    center={[obra.lat, obra.lng]}
                    radius={Math.min(30, 6 + Math.sqrt(obra.receita) / 200)}
                    color="#E30613"
                    fillOpacity={0.5}
                  >
                    <LeafletTooltip>{obra.nome} — {formatCurrency(obra.receita)}</LeafletTooltip>
                  </CircleMarker>
                ))}
              </MapContainer>
            ) : (
              <div className="empty-state" style={{ padding: '2rem' }}>
                Nenhuma obra com latitude/longitude cadastrada ainda. Preencha lat/lng em <strong>Obras</strong> para ver o mapa.
              </div>
            )}
          </div>

          <div className="chart-panel">
            <h3>Top 10 Clientes</h3>
            <div className="top-clientes-list">
              {top10Clientes.map((c, i) => (
                <div className="top-cliente-row" key={c.name}>
                  <span className="top-cliente-rank">{i + 1}</span>
                  <div>
                    <span>{c.name}</span>
                    <div className="top-cliente-bar-track">
                      <div className="top-cliente-bar-fill" style={{ width: `${(c.value / maxTop10) * 100}%` }} />
                    </div>
                  </div>
                  <span className="top-cliente-value">{formatCurrency(c.value, { abbreviate: true })}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, variant }) {
  return (
    <div className={`kpi-card ${variant || ''}`}>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
    </div>
  );
}
