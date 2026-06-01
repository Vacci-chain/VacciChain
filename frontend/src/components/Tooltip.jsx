import { useState, useRef, useEffect } from 'react';

/**
 * Tooltip component that appears on hover and keyboard focus.
 * Accessible via role="tooltip" and aria-describedby.
 */
export default function Tooltip({ children, text, position = 'top' }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (!visible || !triggerRef.current || !tooltipRef.current) return;

    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    const rect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let top, left;
    const gap = 8;

    if (position === 'top') {
      top = rect.top - tooltipRect.height - gap;
      left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    } else if (position === 'bottom') {
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    } else if (position === 'left') {
      top = rect.top + rect.height / 2 - tooltipRect.height / 2;
      left = rect.left - tooltipRect.width - gap;
    } else if (position === 'right') {
      top = rect.top + rect.height / 2 - tooltipRect.height / 2;
      left = rect.right + gap;
    }

    // Keep tooltip within viewport
    if (left < 0) left = 8;
    if (left + tooltipRect.width > window.innerWidth) left = window.innerWidth - tooltipRect.width - 8;
    if (top < 0) top = rect.bottom + gap;

    setCoords({ top: Math.round(top), left: Math.round(left) });
  }, [visible, position]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') setVisible(false);
  };

  return (
    <span
      ref={triggerRef}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      onKeyDown={handleKeyDown}
      style={{ position: 'relative', display: 'inline-block' }}
      aria-describedby={visible ? tooltipId.current : undefined}
    >
      {children}
      {visible && (
        <div
          ref={tooltipRef}
          id={tooltipId.current}
          role="tooltip"
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            background: '#1e293b',
            color: '#e2e8f0',
            padding: '0.5rem 0.75rem',
            borderRadius: 6,
            fontSize: '0.8rem',
            whiteSpace: 'nowrap',
            zIndex: 10000,
            border: '1px solid #334155',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {text}
        </div>
      )}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </span>
  );
}
