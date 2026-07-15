import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const VARIANTS = {
  success: { icon: CheckCircle, bg: '#F0FFF4', border: '#38A169', text: '#276749' },
  error:   { icon: XCircle,     bg: '#FFF5F5', border: '#E53E3E', text: '#742A2A' },
  warning: { icon: AlertTriangle, bg: '#FFFAF0', border: '#DD6B20', text: '#7B341E' },
  info:    { icon: Info,         bg: '#EBF8FF', border: '#3182CE', text: '#2A4365' },
};

function ToastItem({ toast, onClose }) {
  const v = VARIANTS[toast.type] ?? VARIANTS.info;
  const Icon = v.icon;

  return (
    <div className="toast-item" style={{
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      padding: '12px 14px',
      background: v.bg,
      border: `1px solid ${v.border}`,
      borderRadius: '8px',
      boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
      maxWidth: '360px', minWidth: '260px',
    }}>
      <Icon size={17} color={v.border} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ flex: 1, fontSize: '13.5px', color: v.text, lineHeight: 1.45 }}>
        {typeof toast.message === 'object' ? JSON.stringify(toast.message) : String(toast.message ?? '')}
      </span>
      <button
        onClick={() => onClose(toast.id)}
        aria-label="Fechar notificação"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: v.text, padding: 0, display: 'flex',
          alignItems: 'center', opacity: 0.55, flexShrink: 0,
        }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onClose }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px',
      display: 'flex', flexDirection: 'column', gap: '8px',
      zIndex: 9999, pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'auto', animation: 'toastIn 0.2s ease' }}>
          <ToastItem toast={t} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}
