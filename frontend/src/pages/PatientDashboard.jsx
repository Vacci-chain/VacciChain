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

  const load = useCallback((p = 1, append = false) => {
    if (!publicKey) return;
    fetchRecords(publicKey, { page: p, limit: PAGE_LIMIT })
      .then((data) => {
        setError(null);
        if (data) {
          const nextRecords = Array.isArray(data.data) ? data.data : [];
          setRecords((current) => (append ? [...current, ...nextRecords] : nextRecords));
          setTotal(data.total ?? 0);
          setPage(data.page ?? p);
        }
      })
      .catch((err) => setError(err.message || 'Failed to fetch records'));
  }, [publicKey, fetchRecords]);

  useEffect(() => { load(page); }, [load]);

  const handleDeclineConsent = () => disconnect();

  if (!publicKey) {
    return (
      <div style={styles.page}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Connect your wallet to view records.</p>
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
          <h2 style={{ color: 'var(--text)', margin: 0 }}>{t('patient.title')}</h2>
          <RoleBadge role="patient" />
        </div>
        {total > 0 && (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Showing {records.length} of {total}
        {records.length > 0 && (
          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
            {records.length} records
          </span>
        )}
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', wordBreak: 'break-all' }}>
        Wallet: {publicKey}
        <CopyButton text={publicKey} label="wallet address" />
      </p>

      {loading && <NFTCardSkeleton count={3} />}
      {!loading && error && (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <p style={{ color: 'var(--color-error)', marginBottom: '0.75rem' }}>⚠️ {error}</p>
          <button style={styles.btn} onClick={() => load(page)}>Retry</button>
        </div>
      )}
      {!loading && !error && records.length === 0 && (
        <EmptyState
          icon="💉"
          heading="No Vaccination Records"
          message="You don't have any vaccination records yet. Contact your healthcare provider to get your vaccinations recorded on the blockchain."
          ctaText="Learn More"
          ctaHref="https://docs.vaccichain.org/patient-guide"
          secondaryCtaText="Refresh"
          secondaryCtaAction={refetch}
        />
      )}

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
