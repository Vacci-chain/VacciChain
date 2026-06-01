import { useState, useCallback, useRef } from 'react';

/**
 * Manages button feedback states: idle → loading → success | error → idle
 * @param {number} resetDelay - ms before returning to idle after success/error (default 2000)
 * @returns {{ state, run, buttonProps }}
 */
export function useButtonState(resetDelay = 2000) {
  const [state, setState] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const timerRef = useRef(null);

  const run = useCallback(async (asyncFn) => {
    if (state === 'loading') return;
    clearTimeout(timerRef.current);
    setState('loading');
    try {
      const result = await asyncFn();
      setState('success');
      timerRef.current = setTimeout(() => setState('idle'), resetDelay);
      return result;
    } catch (err) {
      setState('error');
      timerRef.current = setTimeout(() => setState('idle'), resetDelay);
      throw err;
    }
  }, [state, resetDelay]);

  const buttonProps = {
    disabled: state === 'loading',
    'aria-busy': state === 'loading',
    'aria-live': 'polite',
  };

  return { state, run, buttonProps };
}
