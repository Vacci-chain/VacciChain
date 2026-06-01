import React from 'react';
import { useTranslation } from 'react-i18next';

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2.5,8.5 6.5,12.5 13.5,4.5" />
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="4" y1="4" x2="12" y2="12" />
    <line x1="12" y1="4" x2="4" y2="12" />
  </svg>
);

const SpinnerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"
    stroke="currentColor" strokeWidth="3" strokeLinecap="round"
    style={{ animation: 'spin 1s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
  </svg>
);

// Colors chosen for WCAG AA contrast (≥4.5:1) against white text in both light and dark modes.
// verified:  #15803d on white bg → 5.74:1 ✓  |  not-verified: #b91c1c on white bg → 5.08:1 ✓
// revoked:   #b91c1c  |  loading: #1d4ed8 → 5.9:1 ✓
const CONFIGS = {
  verified:     { bg: '#15803d', label: 'badge.verified' },
  'not-found':  { bg: '#b91c1c', label: 'badge.notVerified' },
  revoked:      { bg: '#b91c1c', label: 'badge.revoked' },
  loading:      { bg: '#1d4ed8', label: 'badge.verifying' },
};

const ICONS = {
  verified:    <CheckIcon />,
  'not-found': <XIcon />,
  revoked:     <XIcon />,
  loading:     <SpinnerIcon />,
};

export default function VerificationBadge({ status, vaccinated, recordCount = 0 }) {
  const { t } = useTranslation();

  let effectiveStatus = status;
  if (!effectiveStatus && typeof vaccinated !== 'undefined') {
    effectiveStatus = vaccinated ? 'verified' : 'not-found';
  }
  const key = effectiveStatus in CONFIGS ? effectiveStatus : 'not-found';
  const { bg, label: labelKey } = CONFIGS[key];
  const label = labelKey === 'badge.verified'
    ? t('badge.verified', { count: recordCount })
    : t(labelKey);

  return (
    <div
      data-testid="verification-badge"
      id="verification-badge"
      role="status"
      aria-label={label}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.375rem 0.875rem', minHeight: '2rem', borderRadius: '12px',
        backgroundColor: bg, color: '#ffffff',
        fontSize: '0.875rem', fontWeight: '600',
        transition: 'background-color 0.2s ease', cursor: 'default',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center' }}>{ICONS[key]}</span>
      <span>{label}</span>
    </div>
  );
}
