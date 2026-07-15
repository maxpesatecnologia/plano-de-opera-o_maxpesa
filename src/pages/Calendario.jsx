import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePlano } from '../context/PlanoContext';
import { formatCurrency } from '../lib/formatters';
import './Calendario.css';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function isoDay(dateStr) {
  return dateStr ? dateStr.slice(0, 10) : null;
}

export default function Calendario({ referenceDate }) {
  const { planos, loading } = usePlano();
  const [cursor, setCursor] = useState(referenceDate || new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const eventsByDay = useMemo(() => {
    const map = new Map();
    const push = (day, evt) => {
      if (!day) return;
      const list = map.get(day) || [];
      list.push(evt);
      map.set(day, list);
    };
    planos.forEach((p) => {
      push(isoDay(p.termino_ajustado), { tipo: 'vencimento', label: `Vencimento — ${p.cliente?.nome}`, plano: p });
      (p.medicoes || []).forEach((m) => {
        push(isoDay(m.data_medicao), { tipo: 'medicao', label: `Medição — ${p.cliente?.nome}`, plano: p });
        push(isoDay(m.aprovado_em), { tipo: 'aprovacao', label: `Aprovação — ${p.cliente?.nome}`, plano: p });
      });
      (p.faturamentos || []).forEach((f) => {
        push(isoDay(f.data_emissao), { tipo: 'faturamento', label: `NF ${f.numero_nf || ''} — ${formatCurrency(f.valor)}`, plano: p });
      });
    });
    return map;
  }, [planos]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dayKey = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  if (loading) return <div className="empty-state">Carregando...</div>;

  return (
    <div>
      <div className="page-header"><h1>Calendário</h1></div>

      <div className="calendar-nav">
        <button className="btn-ghost" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft /></button>
        <strong>{MONTHS[month]} {year}</strong>
        <button className="btn-ghost" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight /></button>
      </div>

      <div className="panel">
        <div className="calendar-grid">
          {WEEKDAYS.map((w) => <div key={w} className="calendar-weekday">{w}</div>)}
          {cells.map((d, i) => {
            if (!d) return <div key={i} className="calendar-day empty" />;
            const key = dayKey(d);
            const events = eventsByDay.get(key) || [];
            return (
              <div
                key={key}
                className={`calendar-day ${selectedDay === key ? 'selected' : ''}`}
                onClick={() => setSelectedDay(key)}
              >
                <span className="day-number">{d}</span>
                {events.slice(0, 3).map((e, idx) => (
                  <span key={idx} className={`event-dot event-${e.tipo}`}>{e.label}</span>
                ))}
                {events.length > 3 && <span className="text-xs text-muted">+{events.length - 3}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="panel" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Eventos em {selectedDay.split('-').reverse().join('/')}</h3>
          {(eventsByDay.get(selectedDay) || []).length === 0 ? (
            <p className="text-muted">Nenhum evento neste dia.</p>
          ) : (
            <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem' }}>
              {eventsByDay.get(selectedDay).map((e, i) => <li key={i}>{e.label}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
