import { CONNECTION_STEPS } from '../hooks/useFreighter';

const STEP_ORDER = [
  CONNECTION_STEPS.CHECKING,
  CONNECTION_STEPS.REQUESTING_KEY,
  CONNECTION_STEPS.REQUESTING_CHALLENGE,
  CONNECTION_STEPS.SIGNING,
  CONNECTION_STEPS.VERIFYING,
];

const spinnerStyle = {
  width: 16,
  height: 16,
  border: '2px solid #334155',
  borderTopColor: '#38bdf8',
  borderRadius: '50%',
  display: 'inline-block',
  animation: 'spin 0.7s linear infinite',
  flexShrink: 0,
};

/**
 * Shown while wallet connection is in progress.
 * Renders a spinner + current step message.
 */
export default function WalletConnectionProgress({ step, error }) {
  if (!step && !error) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={error ? `Connection error: ${error}` : `Connecting wallet: ${step}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        background: error ? '#1c0a0a' : '#0f172a',
        border: `1px solid ${error ? '#f87171' : '#334155'}`,
        borderRadius: 6,
        fontSize: '0.8rem',
        color: error ? '#f87171' : '#94a3b8',
        minWidth: 0,
        maxWidth: 260,
      }}
    >
      {error ? (
        <span aria-hidden="true" style={{ flexShrink: 0 }}>⚠️</span>
      ) : (
        <>
          <span style={spinnerStyle} aria-hidden="true" />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {error || step}
      </span>
      {!error && (
        <span style={{ color: '#475569', flexShrink: 0, fontSize: '0.7rem' }}>
          {STEP_ORDER.indexOf(step) + 1}/{STEP_ORDER.length}
        </span>
      )}
    </div>
  );
}
