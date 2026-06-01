import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useFreighter';

const s = {
  hero: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '2rem 1.5rem',
    background: 'linear-gradient(160deg, var(--color-primary-900) 0%, var(--color-secondary-900) 100%)',
    color: '#fff',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 'var(--radius-full)',
    padding: '0.3rem 0.9rem',
    fontSize: '0.8rem',
    fontWeight: 500,
    marginBottom: '1.5rem',
    letterSpacing: '0.03em',
  },
  headline: {
    fontSize: 'clamp(2rem, 6vw, 3.5rem)',
    fontWeight: 800,
    lineHeight: 1.15,
    marginBottom: '1rem',
    maxWidth: 700,
  },
  accent: { color: 'var(--color-primary-300)' },
  sub: {
    fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
    color: 'rgba(255,255,255,0.75)',
    maxWidth: 560,
    lineHeight: 1.6,
    marginBottom: '2.5rem',
  },
  ctaRow: { display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '3rem' },
  btnPrimary: {
    padding: '0.85rem 2rem',
    background: 'var(--color-primary-400)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-lg)',
    fontSize: '1rem',
    fontWeight: 600,
    boxShadow: '0 4px 14px rgba(56,189,248,0.4)',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  btnSecondary: {
    padding: '0.85rem 2rem',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 'var(--radius-lg)',
    fontSize: '1rem',
    fontWeight: 600,
  },
  connectedInfo: {
    color: 'var(--color-primary-300)',
    marginBottom: '1rem',
    fontSize: '0.95rem',
  },
  features: {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 680,
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '0.9rem',
  },
  featureIcon: { fontSize: '1.1rem' },
};

const FEATURES = [
  { icon: '🔗', label: 'Stellar Blockchain' },
  { icon: '🛡️', label: 'Soulbound NFTs' },
  { icon: '✅', label: 'Instant Verification' },
  { icon: '🏥', label: 'Issuer-Gated Minting' },
];

export default function Landing() {
  const { t } = useTranslation();
  const { publicKey, connect, disconnect } = useAuth();

  return (
    <section style={s.hero} aria-label="Hero">
      <div style={s.badge}>
        <span>🌐</span> Stellar Testnet
      </div>

      <h1 style={s.headline}>
        Tamper-Proof Vaccination Records{' '}
        <span style={s.accent}>on the Blockchain</span>
      </h1>

      <p style={s.sub}>{t('landing.subtitle')}</p>

      <div style={s.ctaRow}>
        {publicKey ? (
          <>
            <p style={s.connectedInfo}>
              {t('landing.connected', { address: `${publicKey.slice(0, 8)}…${publicKey.slice(-4)}` })}
            </p>
            <button
              style={{ ...s.btnPrimary, background: 'rgba(255,255,255,0.15)' }}
              onClick={disconnect}
              aria-label="Disconnect Freighter wallet"
            >
              {t('landing.disconnect')}
            </button>
          </>
        ) : (
          <>
            <button
              style={s.btnPrimary}
              onClick={connect}
              aria-label="Connect Freighter wallet to get started"
            >
              🔑 {t('landing.connect')}
            </button>
            <a href="/verify" style={s.btnSecondary} role="button" aria-label="Verify a vaccination record">
              🔍 Verify a Record
            </a>
          </>
        )}
      </div>

      <div style={s.features} role="list" aria-label="Key features">
        {FEATURES.map(({ icon, label }) => (
          <div key={label} style={s.feature} role="listitem">
            <span style={s.featureIcon} aria-hidden="true">{icon}</span>
            {label}
          </div>
        ))}
      </div>

      <p style={{ marginTop: '2rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
        {t('landing.requiresFreighter')}
      </p>
    </section>
  );
}
