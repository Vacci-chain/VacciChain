import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RequireAuth from './RequireAuth';

jest.mock('../hooks/useFreighter', () => ({ useAuth: jest.fn() }));
import { useAuth } from '../hooks/useFreighter';

const Protected = () => <div>protected</div>;
const Landing = () => <div>landing</div>;

function renderWithRouter(initialPath, authValue) {
  useAuth.mockReturnValue(authValue);
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/patient"
          element={<RequireAuth><Protected /></RequireAuth>}
        />
        <Route
          path="/issuer"
          element={<RequireAuth requiredRole="issuer"><Protected /></RequireAuth>}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('RequireAuth', () => {
  describe('while hydrating', () => {
    it('renders nothing (no flash of protected content)', () => {
      const { container } = renderWithRouter('/patient', {
        isConnected: false, role: null, hydrating: true,
      });
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('/patient — unauthenticated', () => {
    it('redirects to / when not connected', () => {
      renderWithRouter('/patient', { isConnected: false, role: null, hydrating: false });
      expect(screen.getByText('landing')).toBeInTheDocument();
      expect(screen.queryByText('protected')).not.toBeInTheDocument();
    });
  });

  describe('/patient — authenticated (any role)', () => {
    it('renders the protected page for a patient role', () => {
      renderWithRouter('/patient', { isConnected: true, role: 'patient', hydrating: false });
      expect(screen.getByText('protected')).toBeInTheDocument();
    });

    it('renders the protected page for an issuer role', () => {
      renderWithRouter('/patient', { isConnected: true, role: 'issuer', hydrating: false });
      expect(screen.getByText('protected')).toBeInTheDocument();
    });
  });

  describe('/issuer — no issuer role', () => {
    it('redirects to / when not connected', () => {
      renderWithRouter('/issuer', { isConnected: false, role: null, hydrating: false });
      expect(screen.getByText('landing')).toBeInTheDocument();
    });

    it('redirects to / when connected as patient', () => {
      renderWithRouter('/issuer', { isConnected: true, role: 'patient', hydrating: false });
      expect(screen.getByText('landing')).toBeInTheDocument();
      expect(screen.queryByText('protected')).not.toBeInTheDocument();
    });
  });

  describe('/issuer — with issuer role', () => {
    it('renders the protected page', () => {
      renderWithRouter('/issuer', { isConnected: true, role: 'issuer', hydrating: false });
      expect(screen.getByText('protected')).toBeInTheDocument();
    });
  });

  describe('redirect preserves intended destination', () => {
    it('passes state.from when redirecting from /patient', () => {
      let capturedState;
      const LandingCapture = () => {
        // Access location via useLocation inside a component
        const { useLocation } = require('react-router-dom');
        capturedState = useLocation().state;
        return <div>landing</div>;
      };
      useAuth.mockReturnValue({ isConnected: false, role: null, hydrating: false });
      render(
        <MemoryRouter initialEntries={['/patient']}>
          <Routes>
            <Route path="/" element={<LandingCapture />} />
            <Route path="/patient" element={<RequireAuth><Protected /></RequireAuth>} />
          </Routes>
        </MemoryRouter>
      );
      expect(capturedState).toEqual({ from: '/patient' });
    });
  });

  describe('re-evaluation on auth change', () => {
    it('redirects when isConnected changes to false after render', () => {
      // Initial render: connected
      const authValue = { isConnected: true, role: 'patient', hydrating: false };
      useAuth.mockReturnValue(authValue);
      const { rerender } = render(
        <MemoryRouter initialEntries={['/patient']}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/patient" element={<RequireAuth><Protected /></RequireAuth>} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByText('protected')).toBeInTheDocument();

      // Simulate JWT expiry: isConnected becomes false
      useAuth.mockReturnValue({ isConnected: false, role: null, hydrating: false });
      rerender(
        <MemoryRouter initialEntries={['/patient']}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/patient" element={<RequireAuth><Protected /></RequireAuth>} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByText('landing')).toBeInTheDocument();
      expect(screen.queryByText('protected')).not.toBeInTheDocument();
    });
  });
});
