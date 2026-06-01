import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import CopyButton from './CopyButton';

const STELLAR_EXPERT_BASE = 'https://stellar.expert/explorer/testnet/tx';

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: '1rem',
};
const modalStyle = {
  background: '#0f172a', border: '1px solid #334155', borderRadius: 16,
  padding: '2rem', width: '100%', maxWidth: 520, color: '#e2e8f0', position: 'relative',
};
const row = { marginBottom: '1rem' };
const labelStyle = { fontSize: '0.75rem', color: '#64748b', marginBottom: '0.2rem' };
const valueStyle = { fontSize: '0.95rem', color: '#e2e8f0', wordBreak: 'break-all' };
const closeBtnStyle = {
  position: 'absolute', top: '1rem', right: '1rem',
  background: 'none', border: 'none', color: '#94a3b8',
  fontSize: '1.25rem', cursor: 'pointer', lineHeight: 1,
};

function getFocusableElements(root) {
  if (!root) return [];
  const selectors = 'a[href],button:not([disabled]),textarea, input, select, [tabindex]:not([tabindex="-1"])';
  return Array.from(root.querySelectorAll(selectors)).filter((el) => el.offsetParent !== null);
}

export default function RecordDetailModal({ record, onClose }) {
  const { t } = useTranslation();
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const previousActive = useRef(null);

  if (!record) return null;

  const explorerUrl = record.tx_hash ? `${STELLAR_EXPERT_BASE}/${record.tx_hash}` : null;

  useEffect(() => {
    previousActive.current = document.activeElement;
    const focusable = getFocusableElements(modalRef.current);
    // focus first focusable element or the modal container
    (focusable[0] || modalRef.current)?.focus?.();

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const nodes = getFocusableElements(modalRef.current);
        if (nodes.length === 0) {
          e.preventDefault();
          return;
        }
        const idx = nodes.indexOf(document.activeElement);
        if (e.shiftKey) {
          if (idx === 0 || document.activeElement === modalRef.current) {
            nodes[nodes.length - 1].focus();
            e.preventDefault();
          }
        } else {
          if (idx === nodes.length - 1) {
            nodes[0].focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      // restore previous focus
      previousActive.current?.focus?.();
    };
  }, [onClose]);

  const handleOverlayClick = (e) => { if (e.target === overlayRef.current) onClose(); };

  return (
    <div
      style={overlayStyle}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={t('modal.ariaLabel')}
      ref={overlayRef}
    >
      <div style={modalStyle} ref={modalRef} tabIndex={-1}>
        <button style={closeBtnStyle} onClick={onClose} aria-label={t('modal.close')}>✕</button>
        <h2 style={{ marginBottom: '1.5rem', color: '#38bdf8', fontSize: '1.2rem' }}>
          {t('modal.title')}
        </h2>

        <div style={row}>
          <p style={labelStyle}>Vaccine Name</p>
          <p style={valueStyle}>{record.vaccine_name}</p>
        </div>

        <div style={row}>
          <p style={labelStyle}>Date Administered</p>
          <p style={valueStyle}>{record.date_administered}</p>
        </div>

        <div style={row}>
          <p style={labelStyle}>Token ID</p>
          <p style={valueStyle}>
            #{record.token_id}
            <CopyButton text={String(record.token_id)} label="token ID" />
          </p>
        </div>

        <div style={row}>
          <p style={labelStyle}>Issuer Address</p>
          <p style={valueStyle}>
            {record.issuer}
            <CopyButton text={record.issuer} label="issuer address" />
          </p>
        </div>

        {record.tx_hash && (
          <div style={row}>
            <p style={labelStyle}>Transaction Hash</p>
            <p style={valueStyle}>
              {record.tx_hash}
              <CopyButton text={record.tx_hash} label="transaction hash" />
            </p>
          </div>
        )}

        <div style={{ marginTop: '1.5rem' }}>
          {explorerUrl ? (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block', padding: '0.6rem 1.25rem', background: '#0ea5e9', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: '0.9rem' }}
            >
              {t('modal.viewExplorer')}
            </a>
          ) : (
            <p style={{ color: '#475569', fontSize: '0.85rem' }}>{t('modal.noTxHash')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
