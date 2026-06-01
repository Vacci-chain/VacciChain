import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useFreighter';
import { useToast } from './useToast';

// Module-level cache: walletAddress -> { records, timestamp }
export const cache = new Map();
const CACHE_TTL = 30_000; // 30 seconds

export function useVaccination(walletAddress) {
  const { apiFetch } = useAuth();
  const toast = useToast();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  // Keep latest apiFetch/toast in refs so effects don't re-run when they change
  const apiFetchRef = useRef(apiFetch);
  const toastRef = useRef(toast);
  useEffect(() => { apiFetchRef.current = apiFetch; }, [apiFetch]);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  const fetchFromApi = useCallback(async (wallet, signal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetchRef.current(`/v1/vaccination/${wallet}`, { signal });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const list = Array.isArray(data.data) ? data.data : [];
      cache.set(wallet, { records: list, timestamp: Date.now() });
      setRecords(list);
      return list;
    } catch (e) {
      if (e.name === 'AbortError') return;
      const msg = e.message || 'Failed to fetch records.';
      setError(msg);
      toastRef.current(msg, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []); // stable — uses refs internally

  useEffect(() => {
    if (!walletAddress) return;

    const cached = cache.get(walletAddress);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setRecords(cached.records);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    fetchFromApi(walletAddress, controller.signal);

    return () => { controller.abort(); };
  }, [walletAddress, fetchFromApi]);

  const refetch = useCallback(() => {
    if (!walletAddress) return;
    cache.delete(walletAddress);
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    return fetchFromApi(walletAddress, controller.signal);
  }, [walletAddress, fetchFromApi]);

  const issueVaccination = useCallback(async (payload) => {
    setLoading(true);
    try {
      const res = await apiFetchRef.current('/v1/vaccination/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${data.transactionHash}`;
      toastRef.current(`Vaccination NFT minted! Token ID: ${data.tokenId} — View on Explorer: ${explorerUrl}`, 'success');
      return data;
    } catch (e) {
      toastRef.current(e.message || 'Failed to issue vaccination.', 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkIssuerStatus = useCallback(async () => {
    try {
      const res = await apiFetchRef.current('/v1/issuer/status');
      const data = await res.json();
      return res.ok ? data.authorized : false;
    } catch {
      return false;
    }
  }, []);

  return { records, loading, error, refetch, issueVaccination, checkIssuerStatus };
}
