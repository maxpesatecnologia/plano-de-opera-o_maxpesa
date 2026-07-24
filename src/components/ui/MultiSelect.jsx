import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './MultiSelect.css';

export default function MultiSelect({ placeholder, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const toggleValue = (value) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  const label = selected.length === 0
    ? placeholder
    : selected.length === 1
      ? options.find((o) => o.value === selected[0])?.label ?? placeholder
      : `${selected.length} selecionados`;

  return (
    <div className="multiselect" ref={ref}>
      <button
        type="button"
        className={`multiselect-trigger${selected.length ? ' active' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{label}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="multiselect-panel">
          {selected.length > 0 && (
            <button type="button" className="multiselect-clear" onClick={() => onChange([])}>
              Limpar seleção
            </button>
          )}
          {options.length === 0 ? (
            <div className="multiselect-empty">Nenhuma opção</div>
          ) : (
            options.map((o) => (
              <label key={o.value} className="multiselect-option">
                <input type="checkbox" checked={selected.includes(o.value)} onChange={() => toggleValue(o.value)} />
                <span>{o.label}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}
