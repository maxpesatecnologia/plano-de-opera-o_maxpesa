import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './ToastContext';

const PlanoContext = createContext(null);

export const usePlano = () => useContext(PlanoContext);

const PLANO_SELECT = `
  *,
  cliente:po_clientes(*),
  gerente:po_gerentes(*),
  obra:po_obras(*),
  equipamento:po_equipamentos(*),
  faturamentos:po_faturamentos(*),
  medicoes:po_medicoes(*),
  terceiros:po_terceiros(*)
`;

export const PlanoProvider = ({ children }) => {
  const toast = useToast();
  const [planos, setPlanos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [gerentes, setGerentes] = useState([]);
  const [obras, setObras] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  const loadLookups = useCallback(async () => {
    try {
      const [c, g, o, e] = await Promise.all([
        supabase.from('po_clientes').select('*').order('nome'),
        supabase.from('po_gerentes').select('*').order('nome'),
        supabase.from('po_obras').select('*').order('nome'),
        supabase.from('po_equipamentos').select('*').order('placa'),
      ]);
      setClientes(c.data || []);
      setGerentes(g.data || []);
      setObras(o.data || []);
      setEquipamentos(e.data || []);
    } catch (error) {
      toast?.error(`Erro ao conectar ao Supabase: ${error.message}`);
    }
  }, [toast]);

  const loadPlanos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('po_planos_operacao')
        .select(PLANO_SELECT)
        .order('created_at', { ascending: false })
        .range(0, 9999);
      if (error) throw error;
      setPlanos(data || []);
    } catch (error) {
      toast?.error(`Erro ao carregar planos: ${error.message}`);
    }
  }, [toast]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadLookups(), loadPlanos()]);
    setLoading(false);
  }, [loadLookups, loadPlanos]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const addPlano = useCallback(async (payload) => {
    const { data, error } = await supabase.from('po_planos_operacao').insert(payload).select(PLANO_SELECT).single();
    if (error) { toast?.error(`Erro ao criar plano: ${error.message}`); throw error; }
    setPlanos((prev) => [data, ...prev]);
    toast?.success('Plano criado com sucesso');
    return data;
  }, [toast]);

  const updatePlano = useCallback(async (id, payload) => {
    const { data, error } = await supabase.from('po_planos_operacao').update(payload).eq('id', id).select(PLANO_SELECT).single();
    if (error) { toast?.error(`Erro ao atualizar plano: ${error.message}`); throw error; }
    setPlanos((prev) => prev.map((p) => (p.id === id ? data : p)));
    toast?.success('Plano atualizado');
    return data;
  }, [toast]);

  const deletePlano = useCallback(async (id) => {
    const { error } = await supabase.from('po_planos_operacao').delete().eq('id', id);
    if (error) { toast?.error(`Erro ao excluir plano: ${error.message}`); throw error; }
    setPlanos((prev) => prev.filter((p) => p.id !== id));
    toast?.success('Plano excluído');
  }, [toast]);

  const duplicatePlano = useCallback(async (id) => {
    const original = planos.find((p) => p.id === id);
    if (!original) return;
    const {
      id: _id, created_at, updated_at, cliente, gerente, obra, equipamento,
      faturamentos, medicoes, terceiros, ...rest
    } = original;
    const copy = { ...rest, numero_plano: `${rest.numero_plano || ''} (cópia)`, status_fatura: 'pendente', numero_nf: null };
    return addPlano(copy);
  }, [planos, addPlano]);

  // ── Lookups: busca por nome ou cria ──────────────────────────
  const getOrCreateLookup = useCallback(async (table, nameField, nome, extra = {}, cacheSetter, cache) => {
    if (!nome) return null;
    const existing = cache.find((item) => (item[nameField] || '').toLowerCase().trim() === nome.toLowerCase().trim());
    if (existing) return existing.id;
    const { data, error } = await supabase.from(table).insert({ [nameField]: nome, ...extra }).select('*').single();
    if (error) return null;
    cacheSetter((prev) => [...prev, data]);
    cache.push(data);
    return data.id;
  }, []);

  const bulkImportPlanos = useCallback(async (rows) => {
    setImporting(true);
    try {
      const clientesCache = [...clientes];
      const gerentesCache = [...gerentes];
      const obrasCache = [...obras];
      const equipamentosCache = [...equipamentos];

      const resolved = [];
      for (const row of rows) {
        const cliente_id = await getOrCreateLookup('po_clientes', 'nome', row.cliente, {}, setClientes, clientesCache);
        const gerente_id = await getOrCreateLookup('po_gerentes', 'nome', row.gerente, {}, setGerentes, gerentesCache);
        const obra_id = await getOrCreateLookup('po_obras', 'nome', row.obra, {}, setObras, obrasCache);
        const equipamento_id = row.placa
          ? await getOrCreateLookup('po_equipamentos', 'placa', row.placa, { tipo: row.equipamentoTipo }, setEquipamentos, equipamentosCache)
          : null;

        resolved.push({
          cliente_id, gerente_id, obra_id, equipamento_id,
          numero_plano: row.numeroPlano,
          vencimento_medicao: row.vencimentoMedicao,
          data_envio_medicao: row.dataEnvioMedicao,
          data_aprovacao_medicao: row.dataAprovacaoMedicao,
          emitido_fatura: row.emitidoFatura || false,
          inicio_original: row.inicioOriginal,
          termino_original: row.terminoOriginal,
          dias_original: row.diasOriginal,
          inicio_ajustado: row.inicioAjustado,
          termino_ajustado: row.terminoAjustado,
          dias: row.dias,
          valor_hora: row.valorHora,
          horas_contratuais: row.horasContratuais,
          mobi: row.mobi,
          desmobi: row.desmobi,
          valor_provisionado: row.valorProvisionado,
          receita: row.receita,
          projecao_anual: row.projecaoAnual,
          crescimento: row.crescimento,
          fornecedor_terceiro: row.fornecedorTerceiro,
          custo_hora_terceiro: row.custoHoraTerceiro,
          horas_terceiro: row.horasTerceiro,
          custo_terceiro: row.custoTerceiro,
          status_fatura: row.statusFatura || 'pendente',
          numero_nf: row.numeroNf,
          numero_locacao: row.numeroLocacao,
          mes_faturamento: row.mesFaturamento,
          observacoes: row.observacoes,
        });
      }

      const CHUNK = 500;
      const faturamentosToInsert = [];
      for (let i = 0; i < resolved.length; i += CHUNK) {
        const chunk = resolved.slice(i, i + CHUNK);
        const { data: inserted, error } = await supabase.from('po_planos_operacao').insert(chunk).select('id');
        if (error) throw error;

        // Planos já faturados na planilha (status "faturado" ou com NF preenchida) geram
        // o registro correspondente em po_faturamentos — sem isso, Receita Faturada e
        // Receita Mensal ficam zeradas mesmo com dados reais importados.
        inserted.forEach((row, idx) => {
          const plano = chunk[idx];
          if (plano.status_fatura === 'faturado' || plano.numero_nf) {
            faturamentosToInsert.push({
              plano_id: row.id,
              numero_nf: plano.numero_nf || null,
              valor: plano.receita || 0,
              data_emissao: plano.data_aprovacao_medicao || plano.vencimento_medicao || null,
              status: 'pendente',
            });
          }
        });
      }

      for (let i = 0; i < faturamentosToInsert.length; i += CHUNK) {
        const chunk = faturamentosToInsert.slice(i, i + CHUNK);
        const { error } = await supabase.from('po_faturamentos').insert(chunk);
        if (error) throw error;
      }

      await loadAll();
      toast?.success(`${resolved.length} planos importados com sucesso`);
      return resolved.length;
    } catch (error) {
      toast?.error(`Erro na importação: ${error.message}`);
      throw error;
    } finally {
      setImporting(false);
    }
  }, [clientes, gerentes, obras, equipamentos, getOrCreateLookup, loadAll, toast]);

  // ── Usado pelo formulário de Cadastro: recebe nomes (não ids) e resolve/cria os lookups ──
  const saveFromForm = useCallback(async (form, id) => {
    const clientesCache = [...clientes];
    const gerentesCache = [...gerentes];
    const obrasCache = [...obras];
    const equipamentosCache = [...equipamentos];

    const cliente_id = await getOrCreateLookup('po_clientes', 'nome', form.clienteNome, { cidade: form.cidade, uf: form.uf }, setClientes, clientesCache);
    const gerente_id = await getOrCreateLookup('po_gerentes', 'nome', form.gerenteNome, {}, setGerentes, gerentesCache);
    const obra_id = await getOrCreateLookup('po_obras', 'nome', form.obraNome || form.cidade, { cidade: form.cidade, uf: form.uf }, setObras, obrasCache);
    const equipamento_id = form.placa
      ? await getOrCreateLookup('po_equipamentos', 'placa', form.placa, { tipo: form.equipamentoTipo }, setEquipamentos, equipamentosCache)
      : null;

    const payload = {
      cliente_id, gerente_id, obra_id, equipamento_id,
      numero_plano: form.numeroPlano,
      vencimento_medicao: form.vencimentoMedicao || null,
      data_envio_medicao: form.dataEnvioMedicao || null,
      data_aprovacao_medicao: form.dataAprovacaoMedicao || null,
      emitido_fatura: !!form.emitidoFatura,
      inicio_original: form.inicioOriginal || null,
      termino_original: form.terminoOriginal || null,
      dias_original: form.diasOriginal ? Number(form.diasOriginal) : null,
      inicio_ajustado: form.inicioAjustado || null,
      termino_ajustado: form.terminoAjustado || null,
      dias: form.dias ? Number(form.dias) : null,
      valor_hora: form.valorHora ? Number(form.valorHora) : null,
      horas_contratuais: form.horasContratuais ? Number(form.horasContratuais) : null,
      mobi: Number(form.mobi) || 0,
      desmobi: Number(form.desmobi) || 0,
      valor_provisionado: Number(form.valorProvisionado) || 0,
      receita: Number(form.receita) || 0,
      projecao_anual: Number(form.projecaoAnual) || 0,
      crescimento: form.crescimento ? Number(form.crescimento) : null,
      fornecedor_terceiro: form.fornecedorTerceiro,
      custo_hora_terceiro: Number(form.custoHoraTerceiro) || 0,
      horas_terceiro: Number(form.horasTerceiro) || 0,
      custo_terceiro: Number(form.custoTerceiro) || 0,
      status_fatura: form.statusFatura || 'pendente',
      numero_nf: form.numeroNf,
      numero_locacao: form.numeroLocacao,
      mes_faturamento: form.mesFaturamento,
      observacoes: form.observacoes,
    };

    return id ? updatePlano(id, payload) : addPlano(payload);
  }, [clientes, gerentes, obras, equipamentos, getOrCreateLookup, updatePlano, addPlano]);

  const value = {
    planos, clientes, gerentes, obras, equipamentos,
    loading, importing,
    loadAll, addPlano, updatePlano, deletePlano, duplicatePlano, bulkImportPlanos, saveFromForm,
  };

  return <PlanoContext.Provider value={value}>{children}</PlanoContext.Provider>;
};
