import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NavBar from './NavBar';

const renderNav = (path = '/') =>
  render(<MemoryRouter initialEntries={[path]}><NavBar /></MemoryRouter>);

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
});
