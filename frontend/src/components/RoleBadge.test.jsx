import { render, screen } from '@testing-library/react';
import RoleBadge from './RoleBadge';

describe('RoleBadge', () => {
  it('renders Patient badge with correct text and aria-label', () => {
    render(<RoleBadge role="patient" />);
    const badge = screen.getByText(/Patient/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('aria-label', 'Current role: patient');
  });

  it('renders Issuer badge with correct text and aria-label', () => {
    render(<RoleBadge role="issuer" />);
    const badge = screen.getByText(/Issuer/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('aria-label', 'Current role: issuer');
  });

  it('renders nothing for unknown role', () => {
    const { container } = render(<RoleBadge role="unknown" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when role is undefined', () => {
    const { container } = render(<RoleBadge />);
    expect(container).toBeEmptyDOMElement();
  });
});
