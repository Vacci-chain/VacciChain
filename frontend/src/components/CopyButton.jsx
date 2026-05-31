import { useState, useCallback } from 'react';
import Tooltip from './Tooltip';

/**
 * A small copy-to-clipboard button with a tooltip.
 * Accessible via keyboard (focusable, responds to Enter/Space).
 * Touch target: 44×44px minimum for mobile accessibility.
 */
export default function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback for older browsers
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [text]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCopy(e);
    }
  }, [handleCopy]);

  return (
    <Tooltip text={copied ? 'Copied!' : (label ? `Copy ${label}` : 'Copy to clipboard')} position="top">
      <button
        type="button"
        onClick={handleCopy}
        onKeyDown={handleKeyDown}
        aria-label={copied ? 'Copied!' : (label ? `Copy ${label}` : 'Copy to clipboard')}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.5rem',
          borderRadius: 4,
          color: copied ? '#4ade80' : '#64748b',
          fontSize: '0.85rem',
          lineHeight: 1,
          transition: 'color 0.15s',
          verticalAlign: 'middle',
          minHeight: '44px',
          minWidth: '44px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => { if (!copied) e.currentTarget.style.color = '#38bdf8'; }}
        onMouseLeave={(e) => { if (!copied) e.currentTarget.style.color = '#64748b'; }}
      >
        {copied ? '✓' : '⎘'}
      </button>
    </Tooltip>
  );
}
