import React, { useMemo } from 'react';
import { Search } from 'lucide-react';
import MultiSelect from '../ui/MultiSelect';
import { STATUS_FILTRO_LABELS } from '../../lib/planoFilters';
import { parseDate } from '../../lib/formatters';

export default function FiltrosPlanos({ planos, clientes, gerentes, equipamentos, filtros, setFiltros, busca, setBusca }) {
  const cidades = useMemo(() => [...new Set(planos.map((p) => p.obra?.cidade).filter(Boolean))], [planos]);

  const anos = useMemo(() => {
    const set = new Set(planos.map((p) => parseDate(p.inicio_ajustado)?.getUTCFullYear()).filter(Boolean));
    return [...set].sort();
  }, [planos]);

  const setField = (field) => (values) => setFiltros((f) => ({ ...f, [field]: values }));

  return (
    <div className="filter-bar">
      <div className="search-input">
        <Search size={16} />
        <input placeholder="Pesquisar qualquer informação..." value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>
      <MultiSelect
        placeholder="Cliente (todos)"
        options={clientes.map((c) => ({ value: c.id, label: c.nome }))}
        selected={filtros.cliente}
        onChange={setField('cliente')}
      />
      <MultiSelect
        placeholder="Gerente (todos)"
        options={gerentes.map((g) => ({ value: g.id, label: g.nome }))}
        selected={filtros.gerente}
        onChange={setField('gerente')}
      />
      <MultiSelect
        placeholder="Equipamento (todos)"
        options={equipamentos.map((e) => ({ value: e.id, label: e.placa || e.tipo }))}
        selected={filtros.equipamento}
        onChange={setField('equipamento')}
      />
      <MultiSelect
        placeholder="Cidade (todas)"
        options={cidades.map((c) => ({ value: c, label: c }))}
        selected={filtros.cidade}
        onChange={setField('cidade')}
      />
      <MultiSelect
        placeholder="Status (todos)"
        options={Object.entries(STATUS_FILTRO_LABELS).map(([k, label]) => ({ value: k, label }))}
        selected={filtros.status}
        onChange={setField('status')}
      />
      <MultiSelect
        placeholder="Mês (todos)"
        options={Array.from({ length: 12 }, (_, i) => i + 1).map((m) => ({ value: m, label: String(m) }))}
        selected={filtros.mes}
        onChange={setField('mes')}
      />
      <MultiSelect
        placeholder="Ano (todos)"
        options={anos.map((a) => ({ value: a, label: String(a) }))}
        selected={filtros.ano}
        onChange={setField('ano')}
      />
    </div>
  );
}
