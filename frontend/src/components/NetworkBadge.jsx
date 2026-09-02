import { STELLAR_NETWORK, isTestnet } from '../config/network';

/**
 * Small pill badge that shows the active Stellar network (testnet / mainnet).
 * Testnet is rendered in amber/yellow; mainnet in green.
 */
export default function NetworkBadge() {
  const label = isTestnet ? 'Testnet' : 'Mainnet';

  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.25rem 0.6rem',
    borderRadius: '9999px',
    fontSize: '0.7rem',
    fontWeight: 600,
    letterSpacing: '0.025em',
    textTransform: 'uppercase',
    border: '1px solid',
    whiteSpace: 'nowrap',
    ...(isTestnet
      ? { background: '#fef3c7', color: '#92400e', borderColor: '#fcd34d' }
      : { background: '#dcfce7', color: '#166534', borderColor: '#86efac' }),
  };

  const dotStyle = {
    width: 6,
    height: 6,
    borderRadius: '50%',
    display: 'inline-block',
    background: isTestnet ? '#f59e0b' : '#22c55e',
  };

  return (
    <span style={badgeStyle} aria-label={"Active network: " + label} title={"Stellar " + label}>
      <span aria-hidden="true" style={dotStyle} />
      {label}
    </span>
  );
}
