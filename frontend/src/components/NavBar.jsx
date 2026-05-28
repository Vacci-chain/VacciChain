import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import DarkModeToggle from './DarkModeToggle';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/patient', label: 'My Records' },
  { to: '/issuer', label: 'Issue' },
  { to: '/verify', label: 'Verify' },
  { to: '/admin', label: 'Admin' },
  { to: '/apply', label: 'Apply as Issuer' },
  { to: '/analytics', label: 'Analytics' },
];

export default function NavBar({ dark, onToggleDark }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

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
        style={{
          display: 'none',
          background: 'none',
          border: 'none',
          color: '#e2e8f0',
          fontSize: '1.5rem',
          lineHeight: 1,
          padding: '0.25rem',
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
      >
        {NAV_LINKS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            aria-current={pathname === to ? 'page' : undefined}
            onClick={close}
          >
            {label}
          </Link>
        ))}
        <DarkModeToggle dark={dark} onToggle={onToggleDark} />
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
