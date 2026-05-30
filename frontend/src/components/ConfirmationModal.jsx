import { useEffect, useRef } from 'react';

/**
 * Confirmation modal for destructive actions.
 * Keyboard accessible with focus trap and Escape to close.
 */
export default function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel, loading = false, isDangerous = true }) {
  const modalRef = useRef(null);
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll('button');
        if (!focusableElements?.length) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    confirmBtnRef.current?.focus();

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 9998,
        }}
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-message"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#0f172a',
          border: `2px solid ${isDangerous ? '#ef4444' : '#334155'}`,
          borderRadius: 12,
          padding: '1.5rem',
          maxWidth: 400,
          width: '90%',
          zIndex: 9999,
          boxShadow: '0 20px 25px rgba(0,0,0,0.3)',
        }}
      >
        <h2 id="modal-title" style={{ color: isDangerous ? '#fca5a5' : '#e2e8f0', marginTop: 0, marginBottom: '0.75rem', fontSize: '1.1rem' }}>
          {title}
        </h2>
        <p id="modal-message" style={{ color: '#cbd5e1', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '0.6rem 1.2rem',
              background: '#334155',
              color: '#e2e8f0',
              border: 'none',
              borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.95rem',
              minHeight: '44px',
              minWidth: '44px',
              opacity: loading ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '0.6rem 1.2rem',
              background: isDangerous ? '#ef4444' : '#0ea5e9',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.95rem',
              minHeight: '44px',
              minWidth: '44px',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Processing…' : 'Confirm'}
          </button>
        </div>
      </div>
    </>
  );
}
