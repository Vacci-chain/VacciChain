import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NavBar from './NavBar';

jest.mock('../hooks/useFreighter', () => ({ useAuth: jest.fn() }));
import { useAuth } from '../hooks/useFreighter';

const WALLET = 'GABCD1234WXYZ5678';

const renderNav = (path = '/') =>
  render(<MemoryRouter initialEntries={[path]}><NavBar /></MemoryRouter>);

beforeEach(() => {
  useAuth.mockReturnValue({ publicKey: null, connect: jest.fn(), disconnect: jest.fn() });
});

describe('NavBar', () => {
  it('renders the brand and all nav links', () => {
    renderNav();
    expect(screen.getByText(/VacciChain/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My Records' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Verify' })).toBeInTheDocument();
  });

  it('hamburger button has accessible label "Open menu" when closed', () => {
    renderNav();
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });

  it('toggles aria-label to "Close menu" when opened', () => {
    renderNav();
    fireEvent.click(screen.getByLabelText('Open menu'));
    expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
  });

  it('closes menu on Escape key', () => {
    renderNav();
    fireEvent.click(screen.getByLabelText('Open menu'));
    expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });

  it('marks the active link with aria-current="page"', () => {
    renderNav('/patient');
    expect(screen.getByRole('link', { name: 'My Records' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  describe('wallet indicator', () => {
    it('shows Connect Wallet button when disconnected', () => {
      renderNav();
      expect(screen.getByRole('button', { name: /Connect Wallet/i })).toBeInTheDocument();
    });

    it('calls connect when Connect Wallet is clicked', () => {
      const connect = jest.fn();
      useAuth.mockReturnValue({ publicKey: null, connect, disconnect: jest.fn() });
      renderNav();
      fireEvent.click(screen.getByRole('button', { name: /Connect Wallet/i }));
      expect(connect).toHaveBeenCalledTimes(1);
    });

    it('shows truncated address with green dot when connected', () => {
      useAuth.mockReturnValue({ publicKey: WALLET, connect: jest.fn(), disconnect: jest.fn() });
      renderNav();
      expect(screen.getByText('GABC...5678')).toBeInTheDocument();
    });

    it('toggles dropdown on address click', () => {
      useAuth.mockReturnValue({ publicKey: WALLET, connect: jest.fn(), disconnect: jest.fn() });
      renderNav();
      fireEvent.click(screen.getByText('GABC...5678'));
      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Copy/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Disconnect/i })).toBeInTheDocument();
    });

    it('calls disconnect when Disconnect is clicked', () => {
      const disconnect = jest.fn();
      useAuth.mockReturnValue({ publicKey: WALLET, connect: jest.fn(), disconnect });
      renderNav();
      fireEvent.click(screen.getByText('GABC...5678'));
      fireEvent.click(screen.getByRole('button', { name: /Disconnect/i }));
      expect(disconnect).toHaveBeenCalledTimes(1);
    });
  });
});
