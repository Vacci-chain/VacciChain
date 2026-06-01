import { render, screen } from '@testing-library/react';
import VerificationBadge from './VerificationBadge';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => {
      const map = {
        'badge.verified': `Verified: ${opts?.count ?? 0} Record${opts?.count !== 1 ? 's' : ''}`,
        'badge.notVerified': 'Not Verified',
        'badge.notFound': 'No Records Found',
        'badge.revoked': 'Certificate Revoked',
        'badge.verifying': 'Verifying Status...',
      };
      return map[key] ?? key;
    },
  }),
}));

describe('VerificationBadge', () => {
  it('renders verified status with record count', () => {
    render(<VerificationBadge status="verified" recordCount={3} />);
    expect(screen.getByTestId('verification-badge')).toBeInTheDocument();
    expect(screen.getByText('Verified: 3 Records')).toBeInTheDocument();
  });

  it('renders verified status with singular record', () => {
    render(<VerificationBadge status="verified" recordCount={1} />);
    expect(screen.getByText('Verified: 1 Record')).toBeInTheDocument();
  });

  it('renders not-found status with "Not Verified" label', () => {
    render(<VerificationBadge status="not-found" />);
    expect(screen.getByText('Not Verified')).toBeInTheDocument();
  });

  it('renders revoked status', () => {
    render(<VerificationBadge status="revoked" />);
    expect(screen.getByText('Certificate Revoked')).toBeInTheDocument();
  });

  it('renders loading status', () => {
    render(<VerificationBadge status="loading" />);
    expect(screen.getByText('Verifying Status...')).toBeInTheDocument();
  });

  it('defaults to verified when vaccinated=true without status', () => {
    render(<VerificationBadge vaccinated={true} />);
    expect(screen.getByText('Verified: 0 Records')).toBeInTheDocument();
  });

  it('defaults to not-found when vaccinated=false without status', () => {
    render(<VerificationBadge vaccinated={false} />);
    expect(screen.getByText('Not Verified')).toBeInTheDocument();
  });

  it('renders unknown status as not-found', () => {
    render(<VerificationBadge status="unknown-status" />);
    expect(screen.getByText('Not Verified')).toBeInTheDocument();
  });

  it('verified badge uses green background', () => {
    render(<VerificationBadge status="verified" />);
    expect(screen.getByTestId('verification-badge')).toHaveStyle({ backgroundColor: '#15803d' });
  });

  it('not-found badge uses red background', () => {
    render(<VerificationBadge status="not-found" />);
    expect(screen.getByTestId('verification-badge')).toHaveStyle({ backgroundColor: '#b91c1c' });
  });

  it('revoked badge uses red background', () => {
    render(<VerificationBadge status="revoked" />);
    expect(screen.getByTestId('verification-badge')).toHaveStyle({ backgroundColor: '#b91c1c' });
  });

  it('badge uses white text for contrast', () => {
    render(<VerificationBadge status="verified" />);
    expect(screen.getByTestId('verification-badge')).toHaveStyle({ color: '#ffffff' });
  });

  it('badge meets minimum height (minHeight 2rem)', () => {
    render(<VerificationBadge status="verified" />);
    expect(screen.getByTestId('verification-badge')).toHaveStyle({ minHeight: '2rem' });
  });

  it('badge has role="status" for accessibility', () => {
    render(<VerificationBadge status="verified" recordCount={2} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('badge has aria-label when verified', () => {
    render(<VerificationBadge status="verified" recordCount={2} />);
    const badge = screen.getByTestId('verification-badge');
    expect(badge.getAttribute('aria-label')).toMatch(/verif/i);
  });

  it('badge has aria-label when not verified', () => {
    render(<VerificationBadge vaccinated={false} />);
    const badge = screen.getByTestId('verification-badge');
    expect(badge.getAttribute('aria-label')).toBeTruthy();
  });

  it('SVG icons have aria-hidden to avoid duplicate announcements', () => {
    const { container } = render(<VerificationBadge status="verified" />);
    container.querySelectorAll('svg').forEach(svg =>
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    );
  });
});
