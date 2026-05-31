import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import NFTCard from './NFTCard';

expect.extend(toHaveNoViolations);

describe('NFTCard', () => {
  const mockRecord = {
    token_id: '12345',
    vaccine_name: 'COVID-19',
    date_administered: '2024-01-15',
    issuer: 'GABC1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ12345678901234',
  };

  const mockOnClick = jest.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('renders vaccine name as the most prominent heading', () => {
    render(<NFTCard record={mockRecord} onClick={mockOnClick} />);
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('COVID-19');
  });

  it('renders date with label', () => {
    render(<NFTCard record={mockRecord} />);
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('2024-01-15')).toBeInTheDocument();
  });

  it('renders issuer with label', () => {
    render(<NFTCard record={mockRecord} />);
    expect(screen.getByText('Issuer')).toBeInTheDocument();
    expect(screen.getByText(/GABC1234/)).toBeInTheDocument();
  });

  it('shows Active status badge by default', () => {
    render(<NFTCard record={mockRecord} />);
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent('Active');
    expect(badge).toHaveAttribute('aria-label', 'Status: Active');
  });

  it('shows Revoked status badge when status is revoked', () => {
    render(<NFTCard record={{ ...mockRecord, status: 'revoked' }} />);
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent('Revoked');
    expect(badge).toHaveAttribute('aria-label', 'Status: Revoked');
  });

  it('renders token ID', () => {
    render(<NFTCard record={mockRecord} />);
    expect(screen.getByText('#12345')).toBeInTheDocument();
  });

  it('handles click events', () => {
    render(<NFTCard record={mockRecord} onClick={mockOnClick} />);
    fireEvent.click(screen.getByTestId('nft-card'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('handles Enter key', () => {
    render(<NFTCard record={mockRecord} onClick={mockOnClick} />);
    fireEvent.keyDown(screen.getByTestId('nft-card'), { key: 'Enter' });
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('handles Space key', () => {
    render(<NFTCard record={mockRecord} onClick={mockOnClick} />);
    fireEvent.keyDown(screen.getByTestId('nft-card'), { key: ' ' });
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('renders without onClick handler', () => {
    render(<NFTCard record={mockRecord} />);
    expect(screen.getByTestId('nft-card')).toBeInTheDocument();
  });

  it('displays truncated issuer address', () => {
    render(<NFTCard record={mockRecord} />);
    expect(screen.getByText(/GABC1234/)).toBeInTheDocument();
    expect(screen.getByText(/…1234$/)).toBeInTheDocument();
  });

  it('displays dose progress badge when dose_number and dose_series are present', () => {
    render(<NFTCard record={{ ...mockRecord, dose_number: 2, dose_series: 3 }} />);
    expect(screen.getByText('2/3 doses')).toBeInTheDocument();
    expect(screen.getByLabelText('Dose 2 of 3')).toBeInTheDocument();
  });

  it('displays completed dose badge when series is complete', () => {
    render(<NFTCard record={{ ...mockRecord, dose_number: 3, dose_series: 3 }} />);
    expect(screen.getByText('3/3 doses')).toBeInTheDocument();
  });

  it('displays dose number only when dose_series is absent', () => {
    render(<NFTCard record={{ ...mockRecord, dose_number: 1 }} />);
    expect(screen.getByText('Dose 1')).toBeInTheDocument();
  });

  it('does not display dose badge when dose_number is absent', () => {
    render(<NFTCard record={mockRecord} />);
    expect(screen.queryByText(/doses/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Dose \d/)).not.toBeInTheDocument();
  });

  it('renders without crashing when issuer is null', () => {
    render(<NFTCard record={{ ...mockRecord, issuer: null }} />);
    expect(screen.getByTestId('nft-card')).toBeInTheDocument();
  });

  it('renders without crashing when issuer is undefined', () => {
    render(<NFTCard record={{ ...mockRecord, issuer: undefined }} />);
    expect(screen.getByTestId('nft-card')).toBeInTheDocument();
  });

  it('renders without crashing when patient is null', () => {
    render(<NFTCard record={{ ...mockRecord, patient: null }} />);
    expect(screen.getByTestId('nft-card')).toBeInTheDocument();
  });
});
