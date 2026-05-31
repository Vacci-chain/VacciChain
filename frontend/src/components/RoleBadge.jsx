const ROLE_STYLES = {
  patient: {
    background: 'var(--role-patient-bg, #0c2a4a)',
    color: 'var(--role-patient-text, #38bdf8)',
    border: '1px solid var(--role-patient-border, #0ea5e9)',
    label: '👤 Patient',
  },
  issuer: {
    background: 'var(--role-issuer-bg, #052e16)',
    color: 'var(--role-issuer-text, #4ade80)',
    border: '1px solid var(--role-issuer-border, #22c55e)',
    label: '🏥 Issuer',
  },
};

export default function RoleBadge({ role }) {
  const s = ROLE_STYLES[role];
  if (!s) return null;
  return (
    <span
      aria-label={`Current role: ${role}`}
      style={{
        display: 'inline-block',
        padding: '0.25rem 0.75rem',
        borderRadius: 9999,
        fontSize: '0.8rem',
        fontWeight: 600,
        background: s.background,
        color: s.color,
        border: s.border,
        letterSpacing: '0.02em',
      }}
    >
      {s.label}
    </span>
  );
}
