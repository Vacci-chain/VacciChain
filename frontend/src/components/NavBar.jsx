import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import DarkModeToggle from './DarkModeToggle';
import Tooltip from './Tooltip';
import WalletConnectionProgress from './WalletConnectionProgress';
import { useAuth } from '../hooks/useFreighter';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/patient', label: 'My Records' },
  { to: '/issuer', label: 'Issue' },
  { to: '/verify', label: 'Verify' },
  { to: '/admin', label: 'Admin' },
  { to: '/apply', label: 'Apply as Issuer' },
  { to: '/analytics', label: 'Analytics' },
];

function truncate(addr) {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function WalletIndicator() {
  const { publicKey, connect, disconnect, loading, connectionStep, error } = useAuth();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!publicKey) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end' }}>
        <button
          onClick={connect}
          disabled={loading}
          aria-busy={loading}
          style={{
            padding: '0.6rem 1rem',
            background: 'var(--btn-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: '0.85rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            minHeight: '44px',
            minWidth: '44px',
          }}
        >
          {loading ? 'Connecting…' : 'Connect Wallet'}
        </button>
        {loading && <WalletConnectionProgress step={connectionStep} />}
        {!loading && error && <WalletConnectionProgress error={error} />}
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <Tooltip text={`Wallet: ${truncate(publicKey)}`} position="bottom">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="true"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.6rem 0.75rem',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 6,
            color: '#e2e8f0',
            fontSize: '0.85rem',
            cursor: 'pointer',
            minHeight: '44px',
            minWidth: '44px',
          }}
        >
          <span
            aria-hidden="true"
            style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }}
          />
          {truncate(publicKey)}
        </button>
      </Tooltip>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 6px)',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 8,
            padding: '0.75rem',
            minWidth: 220,
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem', wordBreak: 'break-all', flex: 1 }}>
              {truncate(publicKey)}
            </span>
            <button
              onClick={handleCopy}
              style={{
                padding: '0.4rem 0.6rem',
                fontSize: '0.75rem',
                background: 'transparent',
                border: '1px solid #334155',
                borderRadius: 4,
                color: '#e2e8f0',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                minHeight: '32px',
                minWidth: '32px',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <button
            onClick={() => { disconnect(); setOpen(false); }}
            style={{
              padding: '0.5rem 0.75rem',
              background: 'transparent',
              border: '1px solid #f87171',
              borderRadius: 4,
              color: '#f87171',
              fontSize: '0.8rem',
              cursor: 'pointer',
              textAlign: 'left',
              minHeight: '44px',
            }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

export default function NavBar({ dark, onToggleDark }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const hamburgerRef = useRef(null);
  const linksRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  // When menu opens on small screens, move focus into the menu; restore when closed
  useEffect(() => {
    if (open) {
      // focus first link inside nav-links
      const firstLink = linksRef.current?.querySelector('a, button');
      firstLink?.focus?.();
    } else {
      // restore focus to hamburger button when closing
      hamburgerRef.current?.focus?.();
    }
  }, [open]);

  // Close when route changes
  useEffect(() => { close(); }, [pathname, close]);

  return (
    <nav aria-label="Main navigation" style={{ padding: '1rem 2rem', background: 'var(--nav-bg)', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', position: 'relative' }}>
      <strong style={{ color: 'var(--accent)', fontSize: '1.2rem', flex: 1 }}>💉 VacciChain</strong>

      {/* Hamburger button — visible only below 640px */}
      <button
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="nav-links"
        onClick={() => setOpen((v) => !v)}
        ref={hamburgerRef}
        style={{
          display: 'none',
          background: 'none',
          border: 'none',
          color: '#e2e8f0',
          fontSize: '1.5rem',
          lineHeight: 1,
          padding: '0.5rem',
          minHeight: '44px',
          minWidth: '44px',
          cursor: 'pointer',
        }}
        className="nav-hamburger"
      >
        {open ? '✕' : '☰'}
      </button>

      {/* Nav links */}
      <div
        id="nav-links"
        className="nav-links"
        style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}
        ref={linksRef}
      >
        {NAV_LINKS.map(({ to, label }) => {
          const isActive = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              aria-current={isActive ? 'page' : undefined}
              onClick={close}
              style={isActive ? {
                color: 'var(--accent)',
                borderBottom: '2px solid var(--accent)',
                paddingBottom: '2px',
                fontWeight: 600,
              } : undefined}
            >
              {label}
            </Link>
          );
        })}
        <DarkModeToggle dark={dark} onToggle={onToggleDark} />
        <WalletIndicator />
      </div>

      <style>{`
        @media (max-width: 639px) {
          .nav-hamburger { display: block !important; }
          .nav-links {
            display: ${open ? 'flex' : 'none'} !important;
            flex-direction: column;
            align-items: flex-start;
            width: 100%;
            padding: 0.5rem 0;
            gap: 0.75rem;
          }
        }
      `}</style>
    </nav>
  );
}
