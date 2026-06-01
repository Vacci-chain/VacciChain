import PropTypes from 'prop-types';

const styles = {
  container: {
    textAlign: 'center',
    padding: '3rem 1.5rem',
    background: 'var(--input-bg)',
    border: '1px dashed var(--border)',
    borderRadius: 12,
    color: 'var(--text-muted)',
  },
  icon: {
    fontSize: '3rem',
    display: 'block',
    marginBottom: '1rem',
    lineHeight: 1,
  },
  heading: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: '0.5rem',
  },
  message: {
    fontSize: '0.95rem',
    color: 'var(--text-muted)',
    marginBottom: '1.5rem',
    lineHeight: 1.5,
  },
  cta: {
    padding: '0.7rem 1.5rem',
    background: 'var(--btn-primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: '0.95rem',
    minHeight: '44px',
    textDecoration: 'none',
    display: 'inline-block',
  },
  ctaSecondary: {
    padding: '0.7rem 1.5rem',
    background: 'transparent',
    color: 'var(--btn-primary)',
    border: '1px solid var(--btn-primary)',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: '0.95rem',
    minHeight: '44px',
    textDecoration: 'none',
    display: 'inline-block',
    marginLeft: '0.75rem',
  },
};

export default function EmptyState({ 
  icon = '🩺', 
  heading = 'No records found', 
  message = 'No vaccination records have been issued yet.',
  ctaText,
  ctaAction,
  ctaHref,
  secondaryCtaText,
  secondaryCtaAction,
  secondaryCtaHref,
}) {
  return (
    <div style={styles.container}>
      <span aria-hidden="true" style={styles.icon}>
        {icon}
      </span>
      <h3 style={styles.heading}>{heading}</h3>
      <p style={styles.message}>{message}</p>
      {(ctaText || secondaryCtaText) && (
        <div>
          {ctaText && (
            ctaHref ? (
              <a href={ctaHref} style={styles.cta}>
                {ctaText}
              </a>
            ) : (
              <button onClick={ctaAction} style={styles.cta}>
                {ctaText}
              </button>
            )
          )}
          {secondaryCtaText && (
            secondaryCtaHref ? (
              <a href={secondaryCtaHref} style={styles.ctaSecondary}>
                {secondaryCtaText}
              </a>
            ) : (
              <button onClick={secondaryCtaAction} style={styles.ctaSecondary}>
                {secondaryCtaText}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.string,
  heading: PropTypes.string,
  message: PropTypes.string,
  ctaText: PropTypes.string,
  ctaAction: PropTypes.func,
  ctaHref: PropTypes.string,
  secondaryCtaText: PropTypes.string,
  secondaryCtaAction: PropTypes.func,
  secondaryCtaHref: PropTypes.string,
};
