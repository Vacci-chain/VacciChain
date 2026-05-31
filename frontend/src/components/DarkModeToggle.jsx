import Tooltip from './Tooltip';

export default function DarkModeToggle({ dark, onToggle }) {
  return (
    <Tooltip text={dark ? 'Switch to light mode' : 'Switch to dark mode'} position="bottom">
      <button
        onClick={onToggle}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{
          marginLeft: 'auto',
          padding: '0.6rem 0.75rem',
          background: 'transparent',
          border: '1px solid var(--border)',
          borderRadius: 8,
          color: 'var(--text-muted)',
          fontSize: '1rem',
          minHeight: '44px',
          minWidth: '44px',
          cursor: 'pointer',
        }}
      >
        {dark ? '☀️' : '🌙'}
      </button>
    </Tooltip>
  );
}
