import { parseDate } from './formatters';

const NF_SLA_DIAS = 5; // dias úteis após medição aprovada para exigir NF emitida — ajustável
const EQUIPAMENTO_PARADO_DIAS = 3; // dias parado até virar alerta

const hoje = () => new Date();

function isAtivo(plano) {
  const termino = parseDate(plano.termino_ajustado);
  return !termino || termino >= hoje();
}

export function computeIndicadores(planos) {
  const ativos = planos.filter(isAtivo);

  // Prevista soma TODOS os planos (não só os ativos) para ser comparável com a Faturada
  // (que também é acumulada de todo o histórico) — senão "Em Aberto" fica negativo sempre
  // que o total já faturado supera a projeção só dos planos ainda em andamento.
  const receitaPrevista = sum(planos, (p) => p.projecao_anual);

  const todasFaturamentos = planos.flatMap((p) => p.faturamentos || []);
  const receitaFaturada = sum(todasFaturamentos, (f) => f.valor);

  const receitaEmAberto = receitaPrevista - receitaFaturada;

  const semFaturamento = planos.filter((p) => !(p.faturamentos || []).length);
  const receitaProvisionada = sum(semFaturamento, (p) => p.valor_provisionado);

  const perdidos = planos.filter((p) => p.status_fatura === 'atrasado');
  const receitaPerdida = sum(perdidos, (p) => p.receita);

  const custoTerceiros = sum(planos, (p) => p.custo_terceiro);
  const margem = receitaFaturada > 0 ? ((receitaFaturada - custoTerceiros) / receitaFaturada) * 100 : 0;
  const lucroOperacional = receitaFaturada - custoTerceiros;

  return {
    totalPlanos: planos.length,
    operacoesAtivas: ativos.length,
    operacoesFinalizadas: planos.length - ativos.length,
    receitaPrevista,
    receitaFaturada,
    receitaEmAberto,
    receitaProvisionada,
    receitaPerdida,
    custoTerceiros,
    margem,
    lucroOperacional,
  };
}

export function receitaDiaria(plano) {
  return plano.dias > 0 ? (plano.receita || 0) / plano.dias : 0;
}

export function ticketMedio(plano) {
  return plano.horas_contratuais > 0 ? (plano.receita || 0) / plano.horas_contratuais : 0;
}

export function percentualCrescimento(receitaAtual, receitaAnterior) {
  if (!receitaAnterior) return 0;
  return ((receitaAtual - receitaAnterior) / receitaAnterior) * 100;
}

// ── Alertas automáticos ──────────────────────────────────────
export function computeAlertas(plano) {
  const alertas = [];
  const t = hoje();

  (plano.medicoes || []).forEach((m) => {
    const dataMedicao = parseDate(m.data_medicao);
    if (m.status === 'pendente' && dataMedicao && dataMedicao < t) {
      alertas.push({ tipo: 'medicao_atrasada', label: 'Medição atrasada' });
    }
    if (m.status === 'aprovada' && m.aprovado_em && !plano.numero_nf) {
      const diasDesde = (t - new Date(m.aprovado_em)) / 86_400_000;
      if (diasDesde > NF_SLA_DIAS) {
        alertas.push({ tipo: 'nf_nao_emitida', label: 'NF não emitida' });
      }
    }
  });

  const termino = parseDate(plano.termino_ajustado);
  if (termino && termino < t && plano.status_fatura !== 'faturado') {
    alertas.push({ tipo: 'plano_vencido', label: 'Plano vencido' });
  }

  if (plano.equipamento?.status === 'parado') {
    alertas.push({ tipo: 'equipamento_parado', label: 'Equipamento parado' });
  }

  const mesAtual = t.getMonth() + 1;
  const previstoProRata = (plano.projecao_anual || 0) * (mesAtual / 12);
  if ((plano.receita || 0) < previstoProRata) {
    alertas.push({ tipo: 'receita_abaixo_previsao', label: 'Receita abaixo da previsão' });
  }

  if ((plano.custo_terceiro || 0) > (plano.receita || 0)) {
    alertas.push({ tipo: 'custo_acima_receita', label: 'Custo acima da receita' });
  }

  return alertas;
}

function sum(arr, getter) {
  return arr.reduce((acc, item) => acc + (Number(getter(item)) || 0), 0);
}

export { NF_SLA_DIAS, EQUIPAMENTO_PARADO_DIAS };
