import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'info') => {
    const id = ++_id;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastList
        toasts={toasts}
        onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))}
      />
    </ToastContext.Provider>
  );
}

function ToastList({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        top: '1.5rem',
        right: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        zIndex: 9999,
        alignItems: 'flex-end',
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          style={{
            padding: '0.6rem 0.75rem',
            borderRadius: 8,
            color: '#fff',
            fontSize: '0.9rem',
            maxWidth: 360,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
            background: t.type === 'success' ? '#16a34a' : t.type === 'error' ? '#dc2626' : '#0ea5e9',
          }}
        >
          <Icon type={t.type} />
          <span style={{ flex: 1 }}>{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss"
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function Icon({ type }) {
  const common = { width: 18, height: 18, fill: 'none', stroke: 'white', strokeWidth: 2 };
  if (type === 'success') {
    return (
      <svg viewBox="0 0 24 24" style={{ flex: '0 0 auto' }} {...common}>
        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === 'error') {
    return (
      <svg viewBox="0 0 24 24" style={{ flex: '0 0 auto' }} {...common}>
        <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" style={{ flex: '0 0 auto' }} {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="17" r="1" />
    </svg>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
