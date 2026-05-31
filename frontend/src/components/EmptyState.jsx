export default function EmptyState() {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '3rem 1rem',
        background: 'var(--input-bg)',
        border: '1px dashed var(--border)',
        borderRadius: 12,
        color: 'var(--text-muted)',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>
        🩺
      </span>
      <p>No vaccination records have been issued yet.</p>
    </div>
  );
}
