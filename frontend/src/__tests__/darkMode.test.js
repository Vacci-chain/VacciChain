/**
 * Dark mode tests — issue #277
 * Covers:
 *  1. useDarkMode sets data-theme="dark" on <html>
 *  2. CSS variables resolve to values that pass WCAG AA contrast (4.5:1 for normal text)
 */

import { renderHook, act } from '@testing-library/react';
import { useDarkMode } from '../hooks/useDarkMode';

// ── helpers ──────────────────────────────────────────────────────────────────

/** sRGB channel linearisation */
function linearise(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** Relative luminance of an #rrggbb hex colour */
function luminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}

/** WCAG contrast ratio between two hex colours */
function contrast(hex1, hex2) {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ── useDarkMode ───────────────────────────────────────────────────────────────

describe('useDarkMode', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    // default: light preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockReturnValue({ matches: false }),
    });
  });

  it('sets data-theme="dark" on documentElement when dark=true', () => {
    const { result } = renderHook(() => useDarkMode());
    act(() => result.current[1](true));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('removes data-theme attribute when dark=false', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    const { result } = renderHook(() => useDarkMode());
    act(() => result.current[1](false));
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('persists preference to localStorage', () => {
    const { result } = renderHook(() => useDarkMode());
    act(() => result.current[1](true));
    expect(localStorage.getItem('darkMode')).toBe('true');
    act(() => result.current[1](false));
    expect(localStorage.getItem('darkMode')).toBe('false');
  });

  it('reads initial state from localStorage', () => {
    localStorage.setItem('darkMode', 'true');
    const { result } = renderHook(() => useDarkMode());
    expect(result.current[0]).toBe(true);
  });

  it('falls back to prefers-color-scheme when no localStorage value', () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });
    const { result } = renderHook(() => useDarkMode());
    expect(result.current[0]).toBe(true);
  });
});

// ── WCAG AA contrast checks ───────────────────────────────────────────────────
// Values taken directly from index.css token definitions.

describe('WCAG AA contrast — light mode tokens', () => {
  const pairs = [
    { label: 'text on bg',          fg: '#0f172a', bg: '#ffffff' },
    { label: 'text-muted on bg',    fg: '#64748b', bg: '#ffffff' },
    { label: 'accent on bg',        fg: '#0369a1', bg: '#ffffff' },
    { label: 'nav-text on nav-bg',  fg: '#cbd5e1', bg: '#1e293b' },
    { label: 'error on white',      fg: '#dc2626', bg: '#ffffff' },
    { label: 'success on white',    fg: '#15803d', bg: '#ffffff' },
  ];

  pairs.forEach(({ label, fg, bg }) => {
    it(`${label} meets WCAG AA (≥4.5:1)`, () => {
      expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
    });
  });
});

describe('WCAG AA contrast — dark mode tokens', () => {
  const pairs = [
    { label: 'text on bg',          fg: '#e2e8f0', bg: '#0f172a' },
    { label: 'text-muted on bg',    fg: '#94a3b8', bg: '#0f172a' },
    { label: 'accent on bg',        fg: '#38bdf8', bg: '#0f172a' },
    { label: 'nav-text on nav-bg',  fg: '#cbd5e1', bg: '#1e293b' },
    { label: 'error on dark bg',    fg: '#f87171', bg: '#0f172a' },
    { label: 'success on dark bg',  fg: '#4ade80', bg: '#0f172a' },
    { label: 'chart-bar on track',  fg: '#0ea5e9', bg: '#1e293b' },
    { label: 'badge-high text/bg',  fg: '#fca5a5', bg: '#7f1d1d' },
    { label: 'badge-medium text/bg',fg: '#fcd34d', bg: '#78350f' },
    { label: 'badge-low text/bg',   fg: '#93c5fd', bg: '#1e3a5f' },
  ];

  pairs.forEach(({ label, fg, bg }) => {
    it(`${label} meets WCAG AA (≥4.5:1)`, () => {
      expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
    });
  });
});
