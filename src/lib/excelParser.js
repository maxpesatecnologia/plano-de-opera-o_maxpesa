import * as XLSX from 'xlsx';

const norm = (s) =>
  String(s).toLowerCase().trim()
    .replace(/[aáàâãä]/g, 'a')
    .replace(/[eéèêë]/g, 'e')
    .replace(/[iíìîï]/g, 'i')
    .replace(/[oóòôõö]/g, 'o')
    .replace(/[uúùûü]/g, 'u')
    .replace(/[cç]/g, 'c')
    .replace(/[^a-z0-9]/g, '');

const str = (v) => (v !== undefined && v !== null) ? String(v).trim() : '';

const num = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = parseFloat(String(v).replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '') || String(v).replace(',', '.'));
  return Number.isNaN(n) ? null : n;
};

const bool = (v) => ['sim', 's', 'yes', 'y', 'true', '1'].includes(String(v).trim().toLowerCase());

const toIsoDate = (v) => {
  if (!v) return null;
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, '0');
    const d = String(v.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const parts = s.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
};

const STATUS_ALIASES = {
  faturado: 'faturado',
  pendente: 'pendente',
  emaprovacao: 'em_aprovacao',
  aprovacao: 'em_aprovacao',
  emmedicao: 'em_medicao',
  medicao: 'em_medicao',
  atrasado: 'atrasado',
  vencido: 'atrasado',
};

function normalizeStatus(v) {
  const key = norm(v);
  return STATUS_ALIASES[key] || 'pendente';
}

// Cabeçalho real da planilha "Plano de Operação - Faturamento — Maxpesa 2026"
// (colunas 12 e 15 têm o mesmo nome "Dias operação" na planilha original — original e ajustado —
// por isso o parsing usa índice de coluna em vez de nome único por campo)
export const TEMPLATE_HEADERS = [
  'Cliente', 'Nº do Plano', 'Vencimento da Medição', 'Data Envio Medição', 'Data Aprovação Medição',
  'Emitido Fatura?', 'STATUS DA FATURA', 'Placa', 'Equipamento', 'Início Original', 'Término Original',
  'Dias operação', 'Início Ajustado', 'Término Ajustado', 'Dias operação',
  'Valor c/ ISS por Hora / Mês', 'Qtde Hora/Mês Contratual', 'MOBI', 'DESMOBI', 'PROVISIONADO',
  'Valor da Receita', 'Projeção Anual', 'Crescimento', 'Gerente Contrato', 'Local Obra',
  'Valor de 3º a Pagar', 'Custo HS Terceiro', 'Qtde Hs Terceiro', 'FATURA NF Nº', 'FATURA LOCAÇÃO Nº',
  'Mês Faturamento 2', 'Mês Faturamento',
];

export const parsePlanoExcel = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const grid = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        if (grid.length < 2) { resolve([]); return; }

        const headerRow = grid[0].map((h) => str(h));
        const dataRows = grid.slice(1).filter((r) => r.some((c) => c !== ''));
        const normHeaders = headerRow.map(norm);

        // Retorna todas as posições de coluna cujo cabeçalho normalizado bate com algum alias
        const findAllIdx = (...aliases) => {
          const normAliases = aliases.map(norm);
          return normHeaders.reduce((acc, h, i) => {
            if (normAliases.includes(h)) acc.push(i);
            return acc;
          }, []);
        };
        const findIdx = (...aliases) => findAllIdx(...aliases)[0] ?? -1;
        const get = (row, idx) => (idx !== -1 && row[idx] !== undefined && row[idx] !== null) ? row[idx] : '';

        const idxCliente = findIdx('cliente', 'razao social', 'nome cliente');
        const idxNumeroPlano = findIdx('nº do plano', 'numero do plano', 'numero plano', 'plano');
        const idxVencimentoMedicao = findIdx('vencimento da medicao', 'vencimento medicao');
        const idxDataEnvioMedicao = findIdx('data envio medicao', 'data de envio medicao');
        const idxDataAprovacaoMedicao = findIdx('data aprovacao medicao', 'data de aprovacao medicao');
        const idxEmitidoFatura = findIdx('emitido fatura?', 'emitido fatura');
        const idxStatusFatura = findIdx('status da fatura', 'status fatura', 'status');
        const idxPlaca = findIdx('placa');
        const idxEquipamento = findIdx('equipamento', 'tipo equipamento', 'descricao equipamento');
        const idxInicioOriginal = findIdx('inicio original');
        const idxTerminoOriginal = findIdx('termino original');
        const idxInicioAjustado = findIdx('inicio ajustado');
        const idxTerminoAjustado = findIdx('termino ajustado');

        // "Dias operação" aparece duplicado: 1ª ocorrência = original, 2ª = ajustado
        const diasIdxs = findAllIdx('dias operacao', 'dias operacao ajustado', 'dias');
        const idxDiasOriginal = diasIdxs[0] ?? -1;
        const idxDiasAjustado = diasIdxs[1] ?? diasIdxs[0] ?? -1;

        const idxValorHora = findIdx('valor c/ iss por hora / mes', 'valor hora', 'valor por hora');
        const idxHorasContratuais = findIdx('qtde hora/mes contratual', 'horas contratuais', 'horas contrato');
        const idxMobi = findIdx('mobi', 'mobilizacao');
        const idxDesmobi = findIdx('desmobi', 'desmobilizacao');
        const idxValorProvisionado = findIdx('provisionado', 'valor provisionado', 'provisao');
        const idxReceita = findIdx('valor da receita', 'receita', 'valor faturado');
        const idxProjecaoAnual = findIdx('projecao anual', 'projecao');
        const idxCrescimento = findIdx('crescimento');
        const idxGerente = findIdx('gerente contrato', 'gerente do contrato', 'gerente', 'responsavel');
        const idxObra = findIdx('local obra', 'local da obra', 'obra', 'local');
        const idxCustoTerceiro = findIdx('valor de 3º a pagar', 'valor de 3 a pagar', 'custo terceiro', 'custo de terceiros');
        const idxCustoHoraTerceiro = findIdx('custo hs terceiro');
        const idxHorasTerceiro = findIdx('qtde hs terceiro', 'horas terceiro', 'horas terceiros');
        const idxNumeroNf = findIdx('fatura nf nº', 'fatura nf n', 'numero nf', 'nf', 'nota fiscal');
        const idxNumeroLocacao = findIdx('fatura locacao nº', 'fatura locacao n', 'numero locacao');
        // "Mês Faturamento" e "Mês Faturamento 2" são a mesma informação duplicada na planilha —
        // usa a coluna sem sufixo; se só existir a com sufixo "2", usa ela como alternativa.
        const idxMesFaturamento = findIdx('mes faturamento') !== -1 ? findIdx('mes faturamento') : findIdx('mes faturamento 2');
        const idxObservacoes = findIdx('observacoes', 'observacao', 'obs');

        const parsed = dataRows.map((row) => ({
          cliente: str(get(row, idxCliente)),
          numeroPlano: str(get(row, idxNumeroPlano)),
          vencimentoMedicao: toIsoDate(get(row, idxVencimentoMedicao)),
          dataEnvioMedicao: toIsoDate(get(row, idxDataEnvioMedicao)),
          dataAprovacaoMedicao: toIsoDate(get(row, idxDataAprovacaoMedicao)),
          emitidoFatura: bool(get(row, idxEmitidoFatura)),
          equipamentoTipo: str(get(row, idxEquipamento)),
          placa: str(get(row, idxPlaca)),
          gerente: str(get(row, idxGerente)),
          obra: str(get(row, idxObra)),
          inicioOriginal: toIsoDate(get(row, idxInicioOriginal)),
          terminoOriginal: toIsoDate(get(row, idxTerminoOriginal)),
          diasOriginal: num(get(row, idxDiasOriginal)),
          inicioAjustado: toIsoDate(get(row, idxInicioAjustado)) || toIsoDate(get(row, idxInicioOriginal)),
          terminoAjustado: toIsoDate(get(row, idxTerminoAjustado)) || toIsoDate(get(row, idxTerminoOriginal)),
          dias: num(get(row, idxDiasAjustado)),
          valorHora: num(get(row, idxValorHora)),
          horasContratuais: num(get(row, idxHorasContratuais)),
          mobi: num(get(row, idxMobi)) || 0,
          desmobi: num(get(row, idxDesmobi)) || 0,
          valorProvisionado: num(get(row, idxValorProvisionado)) || 0,
          receita: num(get(row, idxReceita)) || 0,
          projecaoAnual: num(get(row, idxProjecaoAnual)) || 0,
          crescimento: num(get(row, idxCrescimento)),
          fornecedorTerceiro: '',
          custoHoraTerceiro: num(get(row, idxCustoHoraTerceiro)) || 0,
          horasTerceiro: num(get(row, idxHorasTerceiro)) || 0,
          custoTerceiro: num(get(row, idxCustoTerceiro)) || 0,
          statusFatura: normalizeStatus(get(row, idxStatusFatura)),
          numeroNf: str(get(row, idxNumeroNf)),
          numeroLocacao: str(get(row, idxNumeroLocacao)),
          mesFaturamento: str(get(row, idxMesFaturamento)),
          observacoes: str(get(row, idxObservacoes)),
        })).filter((r) => r.cliente || r.numeroPlano);

        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });

export function exportPlanosToExcel(planos, fileName = 'plano_operacao_export.xlsx') {
  const headers = [
    'Cliente', 'Número Plano', 'Equipamento', 'Placa', 'Gerente', 'Local',
    'Início', 'Término', 'Dias', 'Receita', 'Projeção Anual', 'Status da Fatura',
    'Número NF', 'Mês Faturamento',
  ];
  const rows = planos.map((p) => [
    p.cliente?.nome, p.numero_plano, p.equipamento?.tipo, p.equipamento?.placa,
    p.gerente?.nome, p.obra?.nome, p.inicio_ajustado, p.termino_ajustado, p.dias,
    p.receita, p.projecao_anual, p.status_fatura, p.numero_nf, p.mes_faturamento,
  ]);
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plano de Operação');
  XLSX.writeFile(wb, fileName);
}

export function generatePlanoTemplate() {
  const example = [
    'Cliente Exemplo Ltda', 'PLN-0001', '15/01/2026', '16/01/2026', '18/01/2026',
    'Não', 'Pendente', 'ABC-1234', 'Escavadeira', '01/01/2026', '31/12/2026',
    365, '01/01/2026', '31/12/2026', 365,
    250, 2000, 5000, 5000, 30000,
    120000, 480000, 5, 'Fulano de Tal', 'Obra Exemplo',
    15000, 75, 100, '', '',
    'Janeiro', 'Janeiro',
  ];
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, example]);
  ws['!cols'] = TEMPLATE_HEADERS.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, 'template_plano_operacao_maxpesa.xlsx');
}
