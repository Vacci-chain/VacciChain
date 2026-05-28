import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useFreighter';
import { useVaccination } from '../hooks/useVaccination';
import { useConsent } from '../hooks/useConsent';
import NFTCard from '../components/NFTCard';
import RoleBadge from '../components/RoleBadge';
import NFTCardSkeleton from '../components/NFTCardSkeleton';
import RecordDetailModal from '../components/RecordDetailModal';
import CopyButton from '../components/CopyButton';
import QRCodeModal from '../components/QRCodeModal';
import ConsentScreen from '../components/ConsentScreen';

const PAGE_LIMIT = 10;

const styles = {
  page: { maxWidth: 700, width: '100%', margin: '2rem auto', padding: '0 1rem', boxSizing: 'border-box' },
  header: { borderLeft: '4px solid #0ea5e9', paddingLeft: '0.75rem', marginBottom: '1.5rem' },
  btn: { padding: '0.6rem 1.5rem', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' },
  controls: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginTop: '1.25rem' },
  pageBtn: {
    padding: '0.4rem 0.9rem', background: '#1e293b', color: '#e2e8f0',
    border: '1px solid #334155', borderRadius: 6, cursor: 'pointer',
  },
  pageBtnDisabled: { opacity: 0.35, cursor: 'default' },
};

export default function PatientDashboard() {
  const { t } = useTranslation();
  const { publicKey, connect, disconnect } = useAuth();
  const { fetchRecords, loading } = useVaccination();
  const { consented, checkConsent, giveConsent, loading: consentLoading } = useConsent();
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(() => {
    const initial = Number(new URLSearchParams(window.location.search).get('page') || 1);
    return Number.isInteger(initial) && initial > 0 ? initial : 1;
  });
  const [error, setError] = useState(null);
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

  const handleDeclineConsent = () => {
    setError('You must provide consent to view vaccination records.');
  };

  const handleDeclineConsent = () => disconnect();

  if (!publicKey) {
    return (
      <div style={styles.page}>
        <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>Connect your wallet to view records.</p>
        <button style={styles.btn} onClick={connect} aria-label="Connect Freighter wallet to view vaccination records">Connect Wallet</button>
      </div>
    );
  }

  // Show consent screen for first-time patients (consented === false means checked and not yet consented)
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
        {total > 0 && (
          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Showing {records.length} of {total}
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
          <button style={styles.btn} onClick={() => load(page)}>Retry</button>
        </div>
      )}
      {!loading && !error && total === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#475569' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💉</p>
          <p>No vaccination records found for this wallet.</p>
        </div>
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

      {records.length > 0 && records.length < total && (
        <div style={styles.controls}>
          <a
            href={`?page=${page + 1}`}
            style={{
              ...styles.btn,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
            }}
            onClick={(event) => {
              event.preventDefault();
              load(page + 1, true);
            }}
            aria-label="Load more vaccination records"
          >
            {loading ? 'Loading…' : 'Load more'}
          </a>
        </div>
      )}
    </div>
  );
}
