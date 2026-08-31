import { isTestnet } from '../config/network';

export default function DemoBanner() {
  if (!isTestnet) return null;

  return (
    <div
      role="status"
      style={{
        background: '#f59e0b',
        color: '#1e293b',
        textAlign: 'center',
        padding: '0.5rem 1rem',
        fontWeight: 700,
        fontSize: '0.85rem',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
      }}
    >
      TESTNET ENVIRONMENT -- Connected to Stellar Testnet. Records are simulated and the database is wiped weekly. Do not enter real medical data.
    </div>
  );
}
