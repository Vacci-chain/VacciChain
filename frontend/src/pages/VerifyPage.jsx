import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import VerificationBadge from '../components/VerificationBadge';
import NFTCard from '../components/NFTCard';
import CopyButton from '../components/CopyButton';
import EmptyState from '../components/EmptyState';
import { useToast } from '../hooks/useToast';
import FeedbackButton from '../components/FeedbackButton';

const styles = {
  page: { maxWidth: 600, margin: '2rem auto', padding: '0 1rem', boxSizing: 'border-box' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  input: { padding: '0.6rem 0.75rem', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: '1rem', width: '100%', boxSizing: 'border-box', minWidth: 0, minHeight: '44px' },
  btn: { padding: '0.7rem 1.5rem', background: 'var(--btn-primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: '1rem', width: '100%', minHeight: '44px', cursor: 'pointer', touchAction: 'manipulation' },
};

export default function VerifyPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const [wallet, setWallet] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const verify = async (address) => {
    setResult(null);
    setError(null);
    const res = await fetch(`/v1/verify/${address.trim()}`);
    const data = await res.json();
    if (!res.ok) {
      const msg = data.error || 'Verification failed.';
      setError(msg);
      toast(msg, 'error');
      throw new Error(msg);
    }
    setResult(data);
    toast('Verification successful', 'success');
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const w = params.get('wallet');
    if (w) {
      setWallet(w);
      verify(w);
    }
  }, []);

  return (
    <div style={styles.page}>
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--text)' }}>Verify Vaccination Status</h2>
      <form onSubmit={(e) => e.preventDefault()} style={styles.form}>
        <label htmlFor="wallet-input" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
          Stellar wallet address
        </label>
        <input
          id="wallet-input"
          style={styles.input}
          placeholder={t('verify.placeholder')}
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          aria-label="Stellar wallet address to verify"
          required
        />
        <FeedbackButton
          style={styles.btn}
          onClick={() => {
            const trimmed = wallet.trim();
            const url = new URL(window.location);
            url.searchParams.set('wallet', trimmed);
            window.history.pushState({}, '', url);
            return verify(trimmed);
          }}
          loadingLabel="⏳ Checking…"
          successLabel="✅ Verified"
          errorLabel="❌ Failed"
          aria-label="Verify wallet vaccination status"
        >
          Verify
        </FeedbackButton>
      </form>

      <div style={{ marginTop: '1.5rem' }} aria-live="polite" aria-atomic="true">
        {error && <p style={{ color: 'var(--color-error)', margin: 0 }} role="alert">Error: {error}</p>}
        {result && (
          <>
            <VerificationBadge vaccinated={result.vaccinated} recordCount={result.record_count} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem', wordBreak: 'break-all', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
              Wallet: {wallet}
              <CopyButton text={wallet} label="wallet address" />
            </p>
            <div style={{ marginTop: '1rem' }}>
              {result.records && result.records.length > 0 ? (
                result.records.map((r) => <NFTCard key={r.token_id} record={r} />)
              ) : (
                <EmptyState
                  icon="🔍"
                  heading="No Records Found"
                  message="This wallet address has no vaccination records. The wallet may not be registered or no vaccinations have been issued yet."
                  ctaText="Try Another Address"
                  ctaAction={() => {
                    setWallet('');
                    setResult(null);
                    document.getElementById('wallet-input')?.focus();
                  }}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
