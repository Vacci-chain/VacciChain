import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  isConnected,
  getPublicKey,
  signTransaction,
} from '@stellar/freighter-api';
import { useToast } from './useToast';

const AuthContext = createContext(null);
// Only persist publicKey and role — token is kept in memory only
const STORAGE_KEY = 'vaccichain_wallet';

export function AuthProvider({ children }) {
  const toast = useToast();
  const [publicKey, setPublicKey] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [freighterInstalled, setFreighterInstalled] = useState(() => typeof window !== 'undefined' && !!window.freighter);
  // Token lives only in memory — never written to localStorage
  const tokenRef = useRef(null);

  const runSep10 = useCallback(async (pk) => {
    const challengeRes = await fetch('/v1/auth/sep10', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_key: pk }),
    });
    const { transaction, nonce } = await challengeRes.json();
    const signedXDR = await signTransaction(transaction, { network: 'TESTNET' });
    const verifyRes = await fetch('/v1/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction: signedXDR, nonce }),
    });
    const data = await verifyRes.json();
    if (!verifyRes.ok) throw new Error(data.error);
    return data;
  }, []);

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const connected = await isConnected();
      if (!connected) {
        setFreighterInstalled(false);
        throw new Error('Freighter wallet not found. Please install it.');
      }
      const pk = await getPublicKey();
      const data = await runSep10(pk);
      setPublicKey(pk);
      tokenRef.current = data.token;
      setRole(data.role);
      // Persist only publicKey and role — not the token
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ publicKey: pk, role: data.role }));
      toast('Wallet connected.', 'success');
      return data;
    } catch (e) {
      const msg = e.message || 'Failed to connect wallet.';
      setError(msg);
      toast(msg, 'error');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [runSep10, toast]);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    tokenRef.current = null;
    setRole(null);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // On mount: restore publicKey/role from localStorage, but require a fresh SEP-10 for the token
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const { publicKey: savedKey, role: savedRole } = JSON.parse(saved);
    isConnected().then((connected) => {
      if (!connected) {
        setFreighterInstalled(false);
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      // Restore identity so UI shows as connected; token will be fetched on first apiFetch call
      setPublicKey(savedKey);
      setRole(savedRole);
    }).catch(() => localStorage.removeItem(STORAGE_KEY));
  }, []);

  const apiFetch = useCallback(async (url, options = {}) => {
    const doFetch = (t) => fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${t}` },
    });

    // If no token in memory yet, run SEP-10 to get one
    if (!tokenRef.current) {
      const pk = await getPublicKey();
      const data = await runSep10(pk);
      tokenRef.current = data.token;
      setRole(data.role);
    }

    let res = await doFetch(tokenRef.current);

    if (res.status === 401) {
      const pk = await getPublicKey();
      const data = await runSep10(pk);
      tokenRef.current = data.token;
      setRole(data.role);
      res = await doFetch(data.token);
    }

    return res;
  }, [runSep10]);

  const isConnectedState = !!publicKey;

  return (
    <AuthContext.Provider value={{
      publicKey,
      role,
      freighterInstalled,
      connect,
      disconnect,
      apiFetch,
      isConnected: isConnectedState,
      loading,
      error,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
