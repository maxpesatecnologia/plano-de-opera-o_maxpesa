import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './formatters';

const HEADERS = ['Cliente', 'Nº Plano', 'Equipamento', 'Placa', 'Gerente', 'Local', 'Início', 'Término', 'Receita', 'Status'];

function toRows(planos) {
  return planos.map((p) => [
    p.cliente?.nome || '', p.numero_plano || '', p.equipamento?.tipo || '', p.equipamento?.placa || '',
    p.gerente?.nome || '', p.obra?.nome || '', formatDate(p.inicio_ajustado), formatDate(p.termino_ajustado),
    formatCurrency(p.receita), p.status_fatura || '',
  ]);
}

export function exportPlanosToCsv(planos, fileName = 'plano_operacao_export.csv') {
  const rows = toRows(planos);
  const csv = Papa.unparse([HEADERS, ...rows]);
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportPlanosToPdf(planos, fileName = 'plano_operacao_export.pdf') {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(14);
  doc.text('Plano de Operação - Faturamento (Maxpesa)', 14, 15);
  autoTable(doc, {
    head: [HEADERS],
    body: toRows(planos),
    startY: 22,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [227, 6, 19] },
  });
  doc.save(fileName);
}
