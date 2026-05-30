import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useFreighter';
import { useToast } from '../hooks/useToast';
import ConfirmationModal from '../components/ConfirmationModal';
import Tooltip from '../components/Tooltip';

const s = {
  page:    { maxWidth: 700, width: '100%', margin: '2rem auto', padding: '0 1rem', boxSizing: 'border-box' },
  table:   { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
  th:      { textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #334155', color: '#94a3b8' },
  td:      { padding: '0.75rem', borderBottom: '1px solid #1e293b', color: '#e2e8f0', wordBreak: 'break-all' },
  btn:     { padding: '0.6rem 1rem', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.9rem', minHeight: '44px', minWidth: '44px' },
  btnDanger: { padding: '0.6rem 1rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem', minHeight: '44px', minWidth: '44px' },
  btnSuccess: { padding: '0.6rem 1rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem', marginRight: '0.4rem', minHeight: '44px', minWidth: '44px' },
  input:   { padding: '0.6rem 0.75rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#e2e8f0', fontSize: '0.9rem', flex: 1, minHeight: '44px' },
  row:     { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' },
  keyBox:  { marginTop: '1rem', padding: '0.75rem 1rem', background: '#0f172a', borderRadius: 8, color: '#4ade80', fontSize: '0.85rem', wordBreak: 'break-all' },
  badge:   (revoked) => ({ display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: 4, fontSize: '0.75rem', background: revoked ? '#7f1d1d' : '#14532d', color: revoked ? '#fca5a5' : '#86efac' }),
  statusBadge: (status) => {
    const map = { pending: ['#78350f', '#fde68a'], approved: ['#14532d', '#86efac'], rejected: ['#7f1d1d', '#fca5a5'] };
    const [bg, color] = map[status] || ['#1e293b', '#94a3b8'];
    return { display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: 4, fontSize: '0.75rem', background: bg, color };
  },
  section: { marginTop: '2.5rem' },
  h3:      { color: 'var(--text)', marginBottom: '1rem', fontSize: '1.1rem' },
};

export default function AdminDashboard() {
  const { publicKey, role, connect, apiFetch } = useAuth();
  const toast = useToast();
  const [keys, setKeys]             = useState([]);
  const [label, setLabel]           = useState('');
  const [newKey, setNewKey]         = useState(null);
  const [error, setError]           = useState(null);
  const [loading, setLoading]       = useState(false);
  const [applications, setApps]     = useState([]);
  const [reviewError, setReviewErr] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, id: null });

  const fetchKeys = useCallback(async () => {
    const res = await apiFetch('/v1/admin/api-keys');
    if (res.ok) setKeys(await res.json());
  }, [apiFetch]);

  const fetchApplications = useCallback(async () => {
    const res = await apiFetch('/v1/onboarding/applications');
    if (res.ok) setApps(await res.json());
  }, [apiFetch]);

  useEffect(() => {
    if (publicKey && role === 'issuer') {
      fetchKeys();
      fetchApplications();
    }
  }, [publicKey, role, fetchKeys, fetchApplications]);

  if (!publicKey) {
    return (
      <div style={s.page}>
        <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>Connect your admin wallet to manage API keys.</p>
        <button style={s.btn} onClick={connect}>Connect Wallet</button>
      </div>
    );
  }

  if (role !== 'issuer') {
    return <div style={s.page}><p style={{ color: '#f87171' }}>Access denied: admin role required.</p></div>;
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!label.trim()) return;
    setLoading(true);
    setError(null);
    setNewKey(null);
    try {
      const res = await apiFetch('/v1/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewKey(data.key);
      setLabel('');
      await fetchKeys();
      toast('API key created successfully', 'success');
    } catch (err) {
      setError(err.message);
      toast(`Error creating API key: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeClick = (id, label) => {
    setConfirmModal({ isOpen: true, action: 'revoke', id, label });
  };

  const handleRevokeConfirm = async () => {
    const { id } = confirmModal;
    setLoading(true);
    try {
      await apiFetch(`/v1/admin/api-keys/${id}`, { method: 'DELETE' });
      await fetchKeys();
      toast('API key revoked successfully', 'success');
      setConfirmModal({ isOpen: false, action: null, id: null });
    } catch (err) {
      toast(`Error revoking API key: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, decision) => {
    const note = decision === 'rejected' ? window.prompt('Reason for rejection (optional):') : null;
    setReviewErr(null);
    try {
      const res = await apiFetch(`/v1/onboarding/applications/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, reviewer_note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchApplications();
      toast(`Application ${decision} successfully`, 'success');
    } catch (err) {
      setReviewErr(err.message);
      toast(`Error reviewing application: ${err.message}`, 'error');
    }
  };

  return (
    <div style={s.page}>
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--text)' }}>API Key Management</h2>

      <form style={s.row} onSubmit={handleCreate}>
        <input
          style={s.input}
          placeholder="Label (e.g. School District A)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          aria-label="API key label"
          required
        />
        <button style={s.btn} type="submit" disabled={loading} aria-disabled={loading}>
          {loading ? 'Creating…' : 'Create Key'}
        </button>
      </form>

      {error && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{error}</p>}

      {newKey && (
        <div style={s.keyBox} role="alert">
          <strong>New API key (copy now — shown once):</strong>
          <br />
          <code>{newKey}</code>
        </div>
      )}

      {keys.length === 0 ? (
        <p style={{ color: '#64748b' }}>No API keys yet.</p>
      ) : (
        <table style={s.table} aria-label="API keys">
          <thead>
            <tr>
              <th style={s.th}>Label</th>
              <th style={s.th}>Created</th>
              <th style={s.th}>Status</th>
              <th style={s.th}></th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id}>
                <td style={s.td}>{k.label}</td>
                <td style={s.td}>{new Date(k.created_at).toLocaleDateString()}</td>
                <td style={s.td}><span style={s.badge(k.revoked)}>{k.revoked ? 'Revoked' : 'Active'}</span></td>
                <td style={s.td}>
                  {!k.revoked && (
                    <Tooltip text="Revoke this API key" position="left">
                      <button
                        style={s.btnDanger}
                        onClick={() => handleRevokeClick(k.id, k.label)}
                        aria-label={`Revoke ${k.label}`}
                      >
                        Revoke
                      </button>
                    </Tooltip>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ── Issuer Onboarding Applications ── */}
      <div style={s.section}>
        <h3 style={s.h3}>Issuer Onboarding Applications</h3>
        {reviewError && <p style={{ color: '#f87171', marginBottom: '0.75rem' }}>{reviewError}</p>}
        {applications.length === 0 ? (
          <p style={{ color: '#64748b' }}>No applications yet.</p>
        ) : (
          <table style={s.table} aria-label="Issuer applications">
            <thead>
              <tr>
                <th style={s.th}>Name</th>
                <th style={s.th}>Country</th>
                <th style={s.th}>License</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td style={s.td}>{app.name}</td>
                  <td style={s.td}>{app.country}</td>
                  <td style={s.td}>{app.license_number}</td>
                  <td style={s.td}><span style={s.statusBadge(app.status)}>{app.status}</span></td>
                  <td style={s.td}>
                    {app.status === 'pending' && (
                      <>
                        <Tooltip text="Approve this application" position="left">
                          <button style={s.btnSuccess} onClick={() => handleReview(app.id, 'approved')} aria-label={`Approve ${app.name}`}>Approve</button>
                        </Tooltip>
                        <Tooltip text="Reject this application" position="left">
                          <button style={s.btnDanger}  onClick={() => handleReview(app.id, 'rejected')} aria-label={`Reject ${app.name}`}>Reject</button>
                        </Tooltip>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title="Revoke API Key?"
        message={`Are you sure you want to revoke the API key "${confirmModal.label}"? This action cannot be undone and any applications using this key will stop working.`}
        onConfirm={handleRevokeConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, action: null, id: null })}
        loading={loading}
        isDangerous={true}
      />
    </div>
  );
}
