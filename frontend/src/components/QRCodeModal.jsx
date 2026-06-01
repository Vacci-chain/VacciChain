import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

function getFocusableElements(root) {
  if (!root) return [];
  const selectors = 'a[href],button:not([disabled]),textarea, input, select, [tabindex]:not([tabindex="-1"])';
  return Array.from(root.querySelectorAll(selectors)).filter((el) => el.offsetParent !== null);
}

export default function QRCodeModal({ url, onClose }) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const previousActive = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { width: 256, margin: 2 });
    }
  }, [url]);

  useEffect(() => {
    previousActive.current = document.activeElement;
    const nodes = getFocusableElements(modalRef.current);
    (nodes[0] || modalRef.current)?.focus?.();

    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key === 'Tab') {
        const nodes = getFocusableElements(modalRef.current);
        if (nodes.length === 0) { e.preventDefault(); return; }
        const idx = nodes.indexOf(document.activeElement);
        if (e.shiftKey) {
          if (idx === 0 || document.activeElement === modalRef.current) { nodes[nodes.length - 1].focus(); e.preventDefault(); }
        } else {
          if (idx === nodes.length - 1) { nodes[0].focus(); e.preventDefault(); }
        }
      }
    };

    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); previousActive.current?.focus?.(); };
  }, [onClose]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = 'vaccination-qr.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Vaccination QR Code"
      onClick={(e) => e.target === overlayRef.current && onClose()}
      ref={overlayRef}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        tabIndex={-1}
        style={{
          background: '#1e293b', borderRadius: 12, padding: '1.5rem',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
        }}
      >
        <h3 style={{ color: '#e2e8f0', margin: 0 }}>Vaccination QR Code</h3>
        <canvas ref={canvasRef} style={{ borderRadius: 8 }} />
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleDownload}
            style={{ padding: '0.5rem 1.25rem', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            Download PNG
          </button>
          <button
            onClick={onClose}
            style={{ padding: '0.5rem 1.25rem', background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
