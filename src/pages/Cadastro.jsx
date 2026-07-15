import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlano } from '../context/PlanoContext';
import { diffDays } from '../lib/formatters';

const STATUS_OPTIONS = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_medicao', label: 'Em Medição' },
  { value: 'em_aprovacao', label: 'Em Aprovação' },
  { value: 'faturado', label: 'Faturado' },
  { value: 'atrasado', label: 'Atrasado' },
];

const emptyForm = {
  clienteNome: '', numeroPlano: '', placa: '', equipamentoTipo: '',
  vencimentoMedicao: '', dataEnvioMedicao: '', dataAprovacaoMedicao: '', emitidoFatura: false,
  inicioOriginal: '', terminoOriginal: '', diasOriginal: '',
  inicioAjustado: '', terminoAjustado: '', dias: '',
  valorHora: '', horasContratuais: '', mobi: '', desmobi: '', valorProvisionado: '',
  receita: '', projecaoAnual: '', crescimento: '', gerenteNome: '', obraNome: '', cidade: '', uf: '',
  fornecedorTerceiro: '', custoHoraTerceiro: '', horasTerceiro: '', custoTerceiro: '', statusFatura: 'pendente',
  numeroNf: '', numeroLocacao: '', mesFaturamento: '', observacoes: '',
};

export default function Cadastro() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { planos, clientes, gerentes, obras, saveFromForm } = usePlano();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) { setForm(emptyForm); return; }
    const plano = planos.find((p) => p.id === id);
    if (!plano) return;
    setForm({
      clienteNome: plano.cliente?.nome || '',
      numeroPlano: plano.numero_plano || '',
      placa: plano.equipamento?.placa || '',
      equipamentoTipo: plano.equipamento?.tipo || '',
      vencimentoMedicao: plano.vencimento_medicao || '',
      dataEnvioMedicao: plano.data_envio_medicao || '',
      dataAprovacaoMedicao: plano.data_aprovacao_medicao || '',
      emitidoFatura: !!plano.emitido_fatura,
      inicioOriginal: plano.inicio_original || '',
      terminoOriginal: plano.termino_original || '',
      diasOriginal: plano.dias_original ?? '',
      inicioAjustado: plano.inicio_ajustado || '',
      terminoAjustado: plano.termino_ajustado || '',
      dias: plano.dias ?? '',
      valorHora: plano.valor_hora ?? '',
      horasContratuais: plano.horas_contratuais ?? '',
      mobi: plano.mobi ?? '',
      desmobi: plano.desmobi ?? '',
      valorProvisionado: plano.valor_provisionado ?? '',
      receita: plano.receita ?? '',
      projecaoAnual: plano.projecao_anual ?? '',
      crescimento: plano.crescimento ?? '',
      gerenteNome: plano.gerente?.nome || '',
      obraNome: plano.obra?.nome || '',
      cidade: plano.obra?.cidade || '',
      uf: plano.obra?.uf || '',
      fornecedorTerceiro: plano.fornecedor_terceiro || '',
      custoHoraTerceiro: plano.custo_hora_terceiro ?? '',
      horasTerceiro: plano.horas_terceiro ?? '',
      custoTerceiro: plano.custo_terceiro ?? '',
      statusFatura: plano.status_fatura || 'pendente',
      numeroNf: plano.numero_nf || '',
      numeroLocacao: plano.numero_locacao || '',
      mesFaturamento: plano.mes_faturamento || '',
      observacoes: plano.observacoes || '',
    });
  }, [id, planos]);

  const set = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === 'inicioAjustado' || field === 'terminoAjustado') {
        const d = diffDays(next.inicioAjustado, next.terminoAjustado);
        if (d !== null) next.dias = d;
      }
      if (field === 'inicioOriginal' || field === 'terminoOriginal') {
        const d = diffDays(next.inicioOriginal, next.terminoOriginal);
        if (d !== null) next.diasOriginal = d;
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveFromForm(form, id);
      navigate('/plano-operacao');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="panel">
      <div className="page-header">
        <h1>{id ? 'Editar Plano' : 'Novo Plano de Operação'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Identificação</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Cliente *</label>
              <input list="lista-clientes" value={form.clienteNome} onChange={set('clienteNome')} required />
              <datalist id="lista-clientes">{clientes.map((c) => <option key={c.id} value={c.nome} />)}</datalist>
            </div>
            <div className="form-group">
              <label>Número do Plano</label>
              <input value={form.numeroPlano} onChange={set('numeroPlano')} />
            </div>
            <div className="form-group">
              <label>Gerente do Contrato</label>
              <input list="lista-gerentes" value={form.gerenteNome} onChange={set('gerenteNome')} />
              <datalist id="lista-gerentes">{gerentes.map((g) => <option key={g.id} value={g.nome} />)}</datalist>
            </div>
            <div className="form-group">
              <label>Local da Obra</label>
              <input list="lista-obras" value={form.obraNome} onChange={set('obraNome')} />
              <datalist id="lista-obras">{obras.map((o) => <option key={o.id} value={o.nome} />)}</datalist>
            </div>
            <div className="form-group">
              <label>Cidade</label>
              <input value={form.cidade} onChange={set('cidade')} />
            </div>
            <div className="form-group">
              <label>UF</label>
              <input value={form.uf} onChange={set('uf')} maxLength={2} />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Equipamento</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Placa</label>
              <input value={form.placa} onChange={set('placa')} />
            </div>
            <div className="form-group">
              <label>Equipamento (tipo)</label>
              <input value={form.equipamentoTipo} onChange={set('equipamentoTipo')} />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Medição</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Vencimento da Medição</label>
              <input type="date" value={form.vencimentoMedicao} onChange={set('vencimentoMedicao')} />
            </div>
            <div className="form-group">
              <label>Data Envio Medição</label>
              <input type="date" value={form.dataEnvioMedicao} onChange={set('dataEnvioMedicao')} />
            </div>
            <div className="form-group">
              <label>Data Aprovação Medição</label>
              <input type="date" value={form.dataAprovacaoMedicao} onChange={set('dataAprovacaoMedicao')} />
            </div>
            <div className="form-group">
              <label>Emitido Fatura?</label>
              <select value={form.emitidoFatura ? 'sim' : 'nao'} onChange={(e) => setForm((f) => ({ ...f, emitidoFatura: e.target.value === 'sim' }))}>
                <option value="nao">Não</option>
                <option value="sim">Sim</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Período</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Início Original</label>
              <input type="date" value={form.inicioOriginal} onChange={set('inicioOriginal')} />
            </div>
            <div className="form-group">
              <label>Término Original</label>
              <input type="date" value={form.terminoOriginal} onChange={set('terminoOriginal')} />
            </div>
            <div className="form-group">
              <label>Dias Operação (Original)</label>
              <input type="number" value={form.diasOriginal} onChange={set('diasOriginal')} />
            </div>
            <div className="form-group">
              <label>Início Ajustado</label>
              <input type="date" value={form.inicioAjustado} onChange={set('inicioAjustado')} />
            </div>
            <div className="form-group">
              <label>Término Ajustado</label>
              <input type="date" value={form.terminoAjustado} onChange={set('terminoAjustado')} />
            </div>
            <div className="form-group">
              <label>Dias Operação (Ajustado)</label>
              <input type="number" value={form.dias} onChange={set('dias')} />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Financeiro</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Valor Hora</label>
              <input type="number" step="0.01" value={form.valorHora} onChange={set('valorHora')} />
            </div>
            <div className="form-group">
              <label>Horas Contratuais</label>
              <input type="number" step="0.01" value={form.horasContratuais} onChange={set('horasContratuais')} />
            </div>
            <div className="form-group">
              <label>MOBI</label>
              <input type="number" step="0.01" value={form.mobi} onChange={set('mobi')} />
            </div>
            <div className="form-group">
              <label>DESMOBI</label>
              <input type="number" step="0.01" value={form.desmobi} onChange={set('desmobi')} />
            </div>
            <div className="form-group">
              <label>Valor Provisionado</label>
              <input type="number" step="0.01" value={form.valorProvisionado} onChange={set('valorProvisionado')} />
            </div>
            <div className="form-group">
              <label>Receita</label>
              <input type="number" step="0.01" value={form.receita} onChange={set('receita')} />
            </div>
            <div className="form-group">
              <label>Projeção Anual</label>
              <input type="number" step="0.01" value={form.projecaoAnual} onChange={set('projecaoAnual')} />
            </div>
            <div className="form-group">
              <label>Crescimento (%)</label>
              <input type="number" step="0.01" value={form.crescimento} onChange={set('crescimento')} />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Terceiros</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Fornecedor Terceiro</label>
              <input value={form.fornecedorTerceiro} onChange={set('fornecedorTerceiro')} />
            </div>
            <div className="form-group">
              <label>Custo HS Terceiro (valor/hora)</label>
              <input type="number" step="0.01" value={form.custoHoraTerceiro} onChange={set('custoHoraTerceiro')} />
            </div>
            <div className="form-group">
              <label>Qtde Hs Terceiro</label>
              <input type="number" step="0.01" value={form.horasTerceiro} onChange={set('horasTerceiro')} />
            </div>
            <div className="form-group">
              <label>Valor de 3º a Pagar</label>
              <input type="number" step="0.01" value={form.custoTerceiro} onChange={set('custoTerceiro')} />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Faturamento</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Status da Fatura</label>
              <select value={form.statusFatura} onChange={set('statusFatura')}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Número NF</label>
              <input value={form.numeroNf} onChange={set('numeroNf')} />
            </div>
            <div className="form-group">
              <label>Número Locação</label>
              <input value={form.numeroLocacao} onChange={set('numeroLocacao')} />
            </div>
            <div className="form-group">
              <label>Mês de Faturamento</label>
              <input value={form.mesFaturamento} onChange={set('mesFaturamento')} placeholder="ex: Janeiro/2026" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Observações</h3>
          <div className="form-group">
            <textarea rows={4} value={form.observacoes} onChange={set('observacoes')} />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/plano-operacao')} disabled={saving}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar Plano'}</button>
        </div>
      </form>
    </div>
  );
}
