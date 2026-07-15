export function formatCurrency(value, { abbreviate = false } = {}) {
  const n = Number(value) || 0;
  if (abbreviate) {
    if (Math.abs(n) >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}Mi`;
    if (Math.abs(n) >= 1_000) return `R$ ${(n / 1_000).toFixed(1)}K`;
  }
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(value) {
  if (!value) return '-';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-BR');
}

export function formatPercent(value, digits = 1) {
  const n = Number(value) || 0;
  return `${n.toFixed(digits)}%`;
}

// Aceita ISO (yyyy-mm-dd) e BR (dd/mm/yyyy)
export function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s);
  const brMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (brMatch) {
    const [, dd, mm, yyyy] = brMatch;
    const year = yyyy.length === 2 ? `20${yyyy}` : yyyy;
    return new Date(`${year}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`);
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function diffDays(start, end) {
  const a = parseDate(start);
  const b = parseDate(end);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}
