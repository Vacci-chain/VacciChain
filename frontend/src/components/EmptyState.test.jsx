import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renders with default props', () => {
    render(<EmptyState />);
    expect(screen.getByText('No records found')).toBeInTheDocument();
    expect(screen.getByText('No vaccination records have been issued yet.')).toBeInTheDocument();
  });

  it('renders custom icon, heading, and message', () => {
    render(
      <EmptyState
        icon="🔍"
        heading="Custom Heading"
        message="Custom message text"
      />
    );
    expect(screen.getByText('🔍')).toBeInTheDocument();
    expect(screen.getByText('Custom Heading')).toBeInTheDocument();
    expect(screen.getByText('Custom message text')).toBeInTheDocument();
  });

  it('renders primary CTA button with action', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <EmptyState
        ctaText="Click Me"
        ctaAction={handleClick}
      />
    );
    const button = screen.getByRole('button', { name: 'Click Me' });
    expect(button).toBeInTheDocument();
    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders primary CTA as link with href', () => {
    render(
      <EmptyState
        ctaText="Learn More"
        ctaHref="https://example.com"
      />
    );
    const link = screen.getByRole('link', { name: 'Learn More' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('renders secondary CTA button', async () => {
    const user = userEvent.setup();
    const handleSecondary = vi.fn();
    render(
      <EmptyState
        ctaText="Primary"
        ctaAction={vi.fn()}
        secondaryCtaText="Secondary"
        secondaryCtaAction={handleSecondary}
      />
    );
    const button = screen.getByRole('button', { name: 'Secondary' });
    await user.click(button);
    expect(handleSecondary).toHaveBeenCalledTimes(1);
  });

  it('renders secondary CTA as link', () => {
    render(
      <EmptyState
        secondaryCtaText="Go Back"
        secondaryCtaHref="/dashboard"
      />
    );
    const link = screen.getByRole('link', { name: 'Go Back' });
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('hides icon from screen readers with aria-hidden', () => {
    const { container } = render(<EmptyState icon="💉" />);
    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveTextContent('💉');
  });

  it('does not render CTA section when no CTAs provided', () => {
    const { container } = render(<EmptyState />);
    const buttons = container.querySelectorAll('button');
    const links = container.querySelectorAll('a');
    expect(buttons).toHaveLength(0);
    expect(links).toHaveLength(0);
  });

  it('renders both primary and secondary CTAs together', () => {
    render(
      <EmptyState
        ctaText="Primary Action"
        ctaAction={vi.fn()}
        secondaryCtaText="Secondary Action"
        secondaryCtaAction={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'Primary Action' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Secondary Action' })).toBeInTheDocument();
  });

  it('applies correct styling structure', () => {
    const { container } = render(
      <EmptyState
        icon="🩺"
        heading="Test Heading"
        message="Test message"
      />
    );
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveStyle({
      textAlign: 'center',
      borderRadius: '12px',
    });
  });
});
