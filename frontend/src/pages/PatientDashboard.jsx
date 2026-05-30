import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useFreighter';
import { useVaccination } from '../hooks/useVaccination';
import { useConsent } from '../hooks/useConsent';
import NFTCard from '../components/NFTCard';
import RoleBadge from '../components/RoleBadge';
import NFTCardSkeleton from '../components/NFTCardSkeleton';
import EmptyState from '../components/EmptyState';
import RecordDetailModal from '../components/RecordDetailModal';
import CopyButton from '../components/CopyButton';
import QRCodeModal from '../components/QRCodeModal';
import ConsentScreen from '../components/ConsentScreen';

const styles = {
  page: { maxWidth: 700, width: '100%', margin: '2rem auto', padding: '0 1rem', boxSizing: 'border-box' },
  header: { borderLeft: '4px solid #0ea5e9', paddingLeft: '0.75rem', marginBottom: '1.5rem' },
  btn: { padding: '0.7rem 1.5rem', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', minHeight: '44px', minWidth: '44px' },
};

export default function PatientDashboard() {
  const { t } = useTranslation();
  const { publicKey, connect, disconnect } = useAuth();
  const { records, loading, error, refetch } = useVaccination(publicKey);
  const { consented, giveConsent, loading: consentLoading } = useConsent();
  const [qrRecord, setQrRecord] = useState(null);

  const handleDeclineConsent = () => disconnect();

  if (!publicKey) {
    return (
      <div style={styles.page}>
        <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>Connect your wallet to view records.</p>
        <button style={styles.btn} onClick={connect} aria-label="Connect Freighter wallet to view vaccination records">Connect Wallet</button>
      </div>
    );
  }

  if (consented === false) {
    return (
      <div style={styles.page}>
        <ConsentScreen
          onAccept={giveConsent}
          onDecline={handleDeclineConsent}
          loading={consentLoading}
        />
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <h2 style={{ color: '#e2e8f0', margin: 0 }}>{t('patient.title')}</h2>
          <RoleBadge role="patient" />
        </div>
        {records.length > 0 && (
          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
            {records.length} records
          </span>
        )}
      </div>
      <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem', wordBreak: 'break-all' }}>
        Wallet: {publicKey}
        <CopyButton text={publicKey} label="wallet address" />
      </p>

      {loading && <NFTCardSkeleton count={3} />}
      {!loading && error && (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <p style={{ color: '#f87171', marginBottom: '0.75rem' }}>⚠️ {error}</p>
          <button style={styles.btn} onClick={refetch}>Retry</button>
        </div>
      )}
      {!loading && !error && records.length === 0 && <EmptyState />}

      {records.map((r) => (
        <NFTCard
          key={r.token_id}
          record={r}
          onShowQR={setQrRecord}
        />
      ))}

      {qrRecord && (
        <QRCodeModal
          url={`${window.location.origin}/verify?wallet=${encodeURIComponent(publicKey)}&token=${encodeURIComponent(qrRecord.token_id)}`}
          onClose={() => setQrRecord(null)}
        />
      )}
    </div>
  );
}
