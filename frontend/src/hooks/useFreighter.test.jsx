import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './useFreighter';

// Mock Freighter API
jest.mock('@stellar/freighter-api', () => ({
  isConnected: jest.fn(),
  getPublicKey: jest.fn(),
  signTransaction: jest.fn(),
}));

// Mock useToast
jest.mock('./useToast', () => ({
  useToast: () => jest.fn(),
}));

import { isConnected, getPublicKey, signTransaction } from '@stellar/freighter-api';

const WALLET = 'GA3AUY2XRF6S7R73ABSLJMKG4R2NQGRUFPEJUGCANMBAAXI4MTBS6AQU';
const TOKEN = 'jwt-token-abc';

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

// Stub fetch globally
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();

  isConnected.mockResolvedValue(true);
  getPublicKey.mockResolvedValue(WALLET);
  signTransaction.mockResolvedValue('signed-xdr');

  global.fetch = jest.fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ transaction: 'challenge-xdr', nonce: 'nonce-1' }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: TOKEN, role: 'patient' }),
    });
});

describe('useFreighter / useAuth', () => {
  it('connect() calls POST /auth/sep10 then POST /auth/verify', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => { await result.current.connect(); });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenNthCalledWith(1, '/v1/auth/sep10', expect.objectContaining({ method: 'POST' }));
    expect(fetch).toHaveBeenNthCalledWith(2, '/v1/auth/verify', expect.objectContaining({ method: 'POST' }));
  });

  it('successful connect sets isConnected: true and publicKey', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => { await result.current.connect(); });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.publicKey).toBe(WALLET);
  });

  it('Freighter signing failure sets error state', async () => {
    signTransaction.mockRejectedValue(new Error('User rejected'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.connect().catch(() => {});
    });

    expect(result.current.error).toBe('User rejected');
    expect(result.current.isConnected).toBe(false);
  });

  it('backend 401 on verify sets error state', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ transaction: 'challenge-xdr', nonce: 'nonce-1' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid signature' }),
      });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.connect().catch(() => {});
    });

    expect(result.current.error).toBe('Invalid signature');
    expect(result.current.isConnected).toBe(false);
  });

  it('disconnect() clears JWT and resets state', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => { await result.current.connect(); });
    expect(result.current.isConnected).toBe(true);

    act(() => { result.current.disconnect(); });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.publicKey).toBeNull();
    expect(localStorage.getItem('vaccichain_wallet')).toBeNull();
  });
});
