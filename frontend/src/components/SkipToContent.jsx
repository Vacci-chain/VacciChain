import { useTranslation } from 'react-i18next';

const styles = {
  skipLink: {
    position: 'absolute',
    top: '-100px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '0.75rem 1.5rem',
    background: 'var(--btn-primary)',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '0 0 8px 8px',
    fontWeight: 600,
    fontSize: '1rem',
    zIndex: 9999,
    transition: 'top 0.2s ease-in-out',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  skipLinkFocus: {
    top: 0,
  },
};

export default function SkipToContent() {
  const { t } = useTranslation();

  const handleClick = (e) => {
    e.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleClick}
      style={styles.skipLink}
      onFocus={(e) => {
        e.target.style.top = '0';
      }}
      onBlur={(e) => {
        e.target.style.top = '-100px';
      }}
      aria-label={t('accessibility.skipToContent', { defaultValue: 'Skip to main content' })}
    >
      {t('accessibility.skipToContent', { defaultValue: 'Skip to main content' })}
    </a>
  );
}
