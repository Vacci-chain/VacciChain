import { useTranslation } from 'react-i18next';
import CopyButton from './CopyButton';
import Tooltip from './Tooltip';
import NFTCardSkeleton from './NFTCardSkeleton';

async function exportCertificate(record) {
  const [{ jsPDF }, QRCode] = await Promise.all([
    import('jspdf'),
    import('qrcode'),
  ]);

  const verifyUrl = `${window.location.origin}/verify/${record.issuer}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 128, margin: 1 });

  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text('VacciChain Vaccination Certificate', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.text(`Vaccine: ${record.vaccine_name}`, 20, 45);
  doc.text(`Date Administered: ${record.date_administered}`, 20, 57);
  doc.text(`Issuer: ${record.issuer?.slice(0, 8)}…${record.issuer?.slice(-4)}`, 20, 69);
  doc.text(`Wallet: ${record.patient?.slice(0, 8) ?? 'N/A'}…${record.patient?.slice(-4) ?? ''}`, 20, 81);
  doc.text(`Token ID: #${record.token_id}`, 20, 93);

  doc.addImage(qrDataUrl, 'PNG', 150, 40, 40, 40);
  doc.setFontSize(8);
  doc.text('Scan to verify on-chain', 155, 84);

  const safeName = record.vaccine_name.replace(/\s+/g, '_');
  doc.save(`VacciChain_${safeName}_${record.date_administered}.pdf`);
}

export default function NFTCard({ record, onClick, loading = false }) {
  const { t } = useTranslation();

  if (loading) return <NFTCardSkeleton count={1} />;

  const isRevoked = record.status === 'revoked';

  return (
    <div
      data-testid="nft-card"
      aria-label={`Vaccination record: ${record.vaccine_name}`}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
      style={{
        background: '#1e293b',
        border: `1px solid ${isRevoked ? '#7f1d1d' : '#334155'}`,
        borderRadius: 12,
        padding: '1.25rem',
        marginBottom: '1rem',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        width: '100%',
        boxSizing: 'border-box',
        minWidth: 0,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = isRevoked ? '#f87171' : '#38bdf8')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = isRevoked ? '#7f1d1d' : '#334155')}
    >
      {/* Header: vaccine name (most prominent) + status badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0', minWidth: 0, wordBreak: 'break-word' }}>
          💉 {record.vaccine_name}
        </h3>
        <span
          data-testid="status-badge"
          aria-label={`Status: ${isRevoked ? 'Revoked' : 'Active'}`}
          style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            padding: '0.2rem 0.6rem',
            borderRadius: 99,
            background: isRevoked ? '#7f1d1d' : '#166534',
            color: isRevoked ? '#fca5a5' : '#86efac',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {isRevoked ? '✕ Revoked' : '✓ Active'}
        </span>
      </div>

      {/* Dose + token ID */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
        {record.dose_number != null && (
          <span
            aria-label={`Dose ${record.dose_number}${record.dose_series != null ? ` of ${record.dose_series}` : ''}`}
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '0.15rem 0.5rem',
              borderRadius: 99,
              background: record.dose_series != null && record.dose_number >= record.dose_series
                ? '#166534'
                : '#1e3a5f',
              color: record.dose_series != null && record.dose_number >= record.dose_series
                ? '#86efac'
                : '#93c5fd',
              whiteSpace: 'nowrap',
            }}
          >
            {record.dose_series != null
              ? `${record.dose_number}/${record.dose_series} doses`
              : `Dose ${record.dose_number}`}
          </span>
        )}
        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'inline-flex', alignItems: 'center' }} aria-label={`Token ID ${record.token_id}`}>
          #{record.token_id}
          <CopyButton text={String(record.token_id)} label="token ID" />
        </span>
      </div>

      {/* Labelled meta fields */}
      <dl style={{ margin: '0.75rem 0 0', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.25rem 0.75rem', fontSize: '0.85rem' }}>
        <dt style={{ color: '#64748b', fontWeight: 500 }}>Date</dt>
        <dd style={{ margin: 0, color: '#cbd5e1' }}>{record.date_administered}</dd>

        <dt style={{ color: '#64748b', fontWeight: 500 }}>Issuer</dt>
        <dd style={{ margin: 0, color: '#94a3b8' }}>
          <Tooltip text={record.issuer} position="top">
            <span style={{ cursor: 'help', borderBottom: '1px dotted #94a3b8' }}>
              {record.issuer?.slice(0, 8)}…{record.issuer?.slice(-4)}
            </span>
          </Tooltip>
        </dd>
      </dl>

      <button
        aria-label={`Export certificate for ${record.vaccine_name}`}
        onClick={(e) => { e.stopPropagation(); exportCertificate(record); }}
        style={{
          marginTop: '0.75rem',
          padding: '0.5rem 0.85rem',
          fontSize: '0.8rem',
          background: 'transparent',
          border: '1px solid #38bdf8',
          borderRadius: 6,
          color: '#38bdf8',
          cursor: 'pointer',
          minHeight: '32px',
          minWidth: '32px',
        }}
      >
        📄 {t('exportCertificate', 'Export Certificate')}
      </button>
    </div>
  );
}
