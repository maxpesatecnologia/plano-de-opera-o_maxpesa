import { parseDate } from './formatters';

export const STATUS_FILTRO_LABELS = {
  faturado: 'Faturado',
  pendente: 'Pendente',
  em_aprovacao: 'Em Aprovação',
  em_medicao: 'Em Medição',
  atrasado: 'Atrasado',
};

export function emptyFiltros() {
  return { cliente: [], gerente: [], equipamento: [], cidade: [], status: [], mes: [], ano: [] };
}

export function filtrarPlanos(planos, filtros, busca) {
  const buscaLower = busca.trim().toLowerCase();

  return planos.filter((p) => {
    if (filtros.cliente.length && !filtros.cliente.includes(p.cliente_id)) return false;
    if (filtros.gerente.length && !filtros.gerente.includes(p.gerente_id)) return false;
    if (filtros.equipamento.length && !filtros.equipamento.includes(p.equipamento_id)) return false;
    if (filtros.cidade.length && !filtros.cidade.includes(p.obra?.cidade)) return false;
    if (filtros.status.length && !filtros.status.includes(p.status_fatura)) return false;

    if (filtros.mes.length || filtros.ano.length) {
      const inicio = parseDate(p.inicio_ajustado);
      if (filtros.mes.length && (!inicio || !filtros.mes.includes(inicio.getUTCMonth() + 1))) return false;
      if (filtros.ano.length && (!inicio || !filtros.ano.includes(inicio.getUTCFullYear()))) return false;
    }

    if (buscaLower) {
      const alvo = [
        p.cliente?.nome, p.numero_plano, p.equipamento?.placa, p.equipamento?.tipo,
        p.gerente?.nome, p.obra?.nome, p.numero_nf, p.observacoes,
      ].join(' ').toLowerCase();
      if (!alvo.includes(buscaLower)) return false;
    }
    return true;
  });
}
