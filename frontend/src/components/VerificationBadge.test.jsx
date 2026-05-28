import { render, screen } from '@testing-library/react';
import VerificationBadge from './VerificationBadge';

describe('VerificationBadge', () => {
  it('should render verified status with record count', () => {
    render(<VerificationBadge status="verified" vaccinated={true} recordCount={3} />);

    const badge = screen.getByTestId('verification-badge');
    expect(badge).toBeInTheDocument();
    expect(screen.getByText('Verified: 3 Records')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('should render verified status with singular record', () => {
    render(<VerificationBadge status="verified" vaccinated={true} recordCount={1} />);

    expect(screen.getByText('Verified: 1 Record')).toBeInTheDocument();
  });

  it('should render not-found status when no records', () => {
    render(<VerificationBadge status="not-found" vaccinated={false} />);

    expect(screen.getByText('No Records Found')).toBeInTheDocument();
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('should render revoked status', () => {
    render(<VerificationBadge status="revoked" />);

    expect(screen.getByText('Certificate Revoked')).toBeInTheDocument();
    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('should render loading status', () => {
    render(<VerificationBadge status="loading" />);

    expect(screen.getByText('Verifying Status...')).toBeInTheDocument();
    expect(screen.getByTestId('verification-badge')).toBeInTheDocument();
  });

  it('should default to verified when vaccinated is true without status', () => {
    render(<VerificationBadge vaccinated={true} />);

    expect(screen.getByText('Verified: 0 Records')).toBeInTheDocument();
  });

  it('should default to not-found when vaccinated is false without status', () => {
    render(<VerificationBadge vaccinated={false} />);

    expect(screen.getByText('No Records Found')).toBeInTheDocument();
  });

  it('should apply correct styling for verified status', () => {
    render(<VerificationBadge status="verified" />);

    const badge = screen.getByTestId('verification-badge');
    expect(badge).toHaveStyle({ color: '#16a34a' });
  });

  it('should apply correct styling for revoked status', () => {
    render(<VerificationBadge status="revoked" />);

    const badge = screen.getByTestId('verification-badge');
    expect(badge).toHaveStyle({ color: '#dc2626' });
  });

  it('should apply correct styling for not-found status', () => {
    render(<VerificationBadge status="not-found" />);

    const badge = screen.getByTestId('verification-badge');
    expect(badge).toHaveStyle({ color: '#64748b' });
  });

  it('should apply correct styling for loading status', () => {
    render(<VerificationBadge status="loading" />);

    const badge = screen.getByTestId('verification-badge');
    expect(badge).toHaveStyle({ color: '#2563eb' });
  });

  it('should render unknown status as not-found', () => {
    render(<VerificationBadge status="unknown-status" />);

    expect(screen.getByText('No Records Found')).toBeInTheDocument();
  });

  // Accessibility and ARIA tests — Closes #343
  it('badge has aria-label when verified', () => {
    render(<VerificationBadge status="verified" recordCount={2} />);
    const badge = screen.getByTestId('verification-badge');
    expect(badge).toHaveAttribute('aria-label');
    expect(badge.getAttribute('aria-label')).toBeTruthy();
  });

  it('badge has aria-label when not verified', () => {
    render(<VerificationBadge vaccinated={false} />);
    const badge = screen.getByTestId('verification-badge');
    expect(badge).toHaveAttribute('aria-label');
    expect(badge.getAttribute('aria-label')).toBeTruthy();
  });

  it('renders correctly with record details (recordCount > 0)', () => {
    render(<VerificationBadge status="verified" vaccinated={true} recordCount={5} />);
    expect(screen.getByText('Verified: 5 Records')).toBeInTheDocument();
  });

  it('renders correctly without record details (recordCount = 0)', () => {
    render(<VerificationBadge status="verified" vaccinated={true} recordCount={0} />);
    expect(screen.getByTestId('verification-badge')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('verified badge aria-label contains meaningful text', () => {
    render(<VerificationBadge status="verified" recordCount={3} />);
    const badge = screen.getByTestId('verification-badge');
    const label = badge.getAttribute('aria-label');
    // Should reference verification state
    expect(label.toLowerCase()).toMatch(/verif/);
  });

  it('not-found badge aria-label contains meaningful text', () => {
    render(<VerificationBadge status="not-found" />);
    const badge = screen.getByTestId('verification-badge');
    const label = badge.getAttribute('aria-label');
    expect(label).toBeTruthy();
  });
});