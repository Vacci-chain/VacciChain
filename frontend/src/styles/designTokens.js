/**
 * Design Tokens - Color System
 * Defines a consistent color palette for light and dark modes
 * Token naming convention: --color-{category}-{shade}
 */

export const colorTokens = {
  light: {
    // Primary palette
    'color-primary-50': '#f0f9ff',
    'color-primary-100': '#e0f2fe',
    'color-primary-200': '#bae6fd',
    'color-primary-300': '#7dd3fc',
    'color-primary-400': '#38bdf8',
    'color-primary-500': '#0ea5e9',
    'color-primary-600': '#0284c7',
    'color-primary-700': '#0369a1',
    'color-primary-800': '#075985',
    'color-primary-900': '#0c3d66',

    // Secondary palette
    'color-secondary-50': '#f5f3ff',
    'color-secondary-100': '#ede9fe',
    'color-secondary-200': '#ddd6fe',
    'color-secondary-300': '#c4b5fd',
    'color-secondary-400': '#a78bfa',
    'color-secondary-500': '#8b5cf6',
    'color-secondary-600': '#7c3aed',
    'color-secondary-700': '#6d28d9',
    'color-secondary-800': '#5b21b6',
    'color-secondary-900': '#4c1d95',

    // Semantic colors
    'color-success-50': '#f0fdf4',
    'color-success-100': '#dcfce7',
    'color-success-200': '#bbf7d0',
    'color-success-300': '#86efac',
    'color-success-400': '#4ade80',
    'color-success-500': '#22c55e',
    'color-success-600': '#16a34a',
    'color-success-700': '#15803d',
    'color-success-800': '#166534',
    'color-success-900': '#145231',

    'color-error-50': '#fef2f2',
    'color-error-100': '#fee2e2',
    'color-error-200': '#fecaca',
    'color-error-300': '#fca5a5',
    'color-error-400': '#f87171',
    'color-error-500': '#ef4444',
    'color-error-600': '#dc2626',
    'color-error-700': '#b91c1c',
    'color-error-800': '#991b1b',
    'color-error-900': '#7f1d1d',

    'color-warning-50': '#fffbeb',
    'color-warning-100': '#fef3c7',
    'color-warning-200': '#fde68a',
    'color-warning-300': '#fcd34d',
    'color-warning-400': '#fbbf24',
    'color-warning-500': '#f59e0b',
    'color-warning-600': '#d97706',
    'color-warning-700': '#b45309',
    'color-warning-800': '#92400e',
    'color-warning-900': '#78350f',

    // Neutral palette
    'color-neutral-50': '#f9fafb',
    'color-neutral-100': '#f3f4f6',
    'color-neutral-200': '#e5e7eb',
    'color-neutral-300': '#d1d5db',
    'color-neutral-400': '#9ca3af',
    'color-neutral-500': '#6b7280',
    'color-neutral-600': '#4b5563',
    'color-neutral-700': '#374151',
    'color-neutral-800': '#1f2937',
    'color-neutral-900': '#111827',

    // Semantic aliases
    'color-bg': '#ffffff',
    'color-text': '#0f172a',
    'color-text-muted': '#64748b',
    'color-border': '#cbd5e1',
    'color-focus-ring': '#0284c7',
    'color-focus-ring-offset': '#ffffff',
  },

  dark: {
    // Primary palette
    'color-primary-50': '#f0f9ff',
    'color-primary-100': '#e0f2fe',
    'color-primary-200': '#bae6fd',
    'color-primary-300': '#7dd3fc',
    'color-primary-400': '#38bdf8',
    'color-primary-500': '#0ea5e9',
    'color-primary-600': '#0284c7',
    'color-primary-700': '#0369a1',
    'color-primary-800': '#075985',
    'color-primary-900': '#0c3d66',

    // Secondary palette
    'color-secondary-50': '#f5f3ff',
    'color-secondary-100': '#ede9fe',
    'color-secondary-200': '#ddd6fe',
    'color-secondary-300': '#c4b5fd',
    'color-secondary-400': '#a78bfa',
    'color-secondary-500': '#8b5cf6',
    'color-secondary-600': '#7c3aed',
    'color-secondary-700': '#6d28d9',
    'color-secondary-800': '#5b21b6',
    'color-secondary-900': '#4c1d95',

    // Semantic colors
    'color-success-50': '#f0fdf4',
    'color-success-100': '#dcfce7',
    'color-success-200': '#bbf7d0',
    'color-success-300': '#86efac',
    'color-success-400': '#4ade80',
    'color-success-500': '#22c55e',
    'color-success-600': '#16a34a',
    'color-success-700': '#15803d',
    'color-success-800': '#166534',
    'color-success-900': '#145231',

    'color-error-50': '#fef2f2',
    'color-error-100': '#fee2e2',
    'color-error-200': '#fecaca',
    'color-error-300': '#fca5a5',
    'color-error-400': '#f87171',
    'color-error-500': '#ef4444',
    'color-error-600': '#dc2626',
    'color-error-700': '#b91c1c',
    'color-error-800': '#991b1b',
    'color-error-900': '#7f1d1d',

    'color-warning-50': '#fffbeb',
    'color-warning-100': '#fef3c7',
    'color-warning-200': '#fde68a',
    'color-warning-300': '#fcd34d',
    'color-warning-400': '#fbbf24',
    'color-warning-500': '#f59e0b',
    'color-warning-600': '#d97706',
    'color-warning-700': '#b45309',
    'color-warning-800': '#92400e',
    'color-warning-900': '#78350f',

    // Neutral palette
    'color-neutral-50': '#f9fafb',
    'color-neutral-100': '#f3f4f6',
    'color-neutral-200': '#e5e7eb',
    'color-neutral-300': '#d1d5db',
    'color-neutral-400': '#9ca3af',
    'color-neutral-500': '#6b7280',
    'color-neutral-600': '#4b5563',
    'color-neutral-700': '#374151',
    'color-neutral-800': '#1f2937',
    'color-neutral-900': '#111827',

    // Semantic aliases
    'color-bg': '#0f172a',
    'color-text': '#e2e8f0',
    'color-text-muted': '#94a3b8',
    'color-border': '#334155',
    'color-focus-ring': '#38bdf8',
    'color-focus-ring-offset': '#0f172a',
  },
};

/**
 * Typography tokens
 */
export const typographyTokens = {
  // Heading levels
  'font-h1-size': '2.25rem',
  'font-h1-weight': '700',
  'font-h1-line-height': '1.2',

  'font-h2-size': '1.875rem',
  'font-h2-weight': '700',
  'font-h2-line-height': '1.25',

  'font-h3-size': '1.5rem',
  'font-h3-weight': '600',
  'font-h3-line-height': '1.35',

  'font-h4-size': '1.25rem',
  'font-h4-weight': '600',
  'font-h4-line-height': '1.4',

  // Body text
  'font-body-size': '1rem',
  'font-body-weight': '400',
  'font-body-line-height': '1.5',

  'font-body-sm-size': '0.875rem',
  'font-body-sm-weight': '400',
  'font-body-sm-line-height': '1.5',

  // Caption
  'font-caption-size': '0.75rem',
  'font-caption-weight': '400',
  'font-caption-line-height': '1.5',

  // Label
  'font-label-size': '0.875rem',
  'font-label-weight': '500',
  'font-label-line-height': '1.5',

  // Font family
  'font-family': 'system-ui, -apple-system, sans-serif',
};

/**
 * Spacing tokens
 */
export const spacingTokens = {
  'spacing-xs': '0.25rem',
  'spacing-sm': '0.5rem',
  'spacing-md': '1rem',
  'spacing-lg': '1.5rem',
  'spacing-xl': '2rem',
  'spacing-2xl': '3rem',
  'spacing-3xl': '4rem',
};

/**
 * Border radius tokens
 */
export const borderRadiusTokens = {
  'radius-sm': '0.25rem',
  'radius-md': '0.375rem',
  'radius-lg': '0.5rem',
  'radius-xl': '0.75rem',
  'radius-full': '9999px',
};

/**
 * Shadow tokens
 */
export const shadowTokens = {
  'shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  'shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  'shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  'shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
};
