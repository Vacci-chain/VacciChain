/**
 * Typography utilities and mixins
 * Provides consistent typography scale across the application
 */

export const typographyClasses = `
  /* Heading H1 - Page titles */
  h1, .h1 {
    font-size: var(--font-h1-size);
    font-weight: var(--font-h1-weight);
    line-height: var(--font-h1-line-height);
    margin-bottom: var(--spacing-lg);
  }

  /* Heading H2 - Section titles */
  h2, .h2 {
    font-size: var(--font-h2-size);
    font-weight: var(--font-h2-weight);
    line-height: var(--font-h2-line-height);
    margin-bottom: var(--spacing-md);
  }

  /* Heading H3 - Subsection titles */
  h3, .h3 {
    font-size: var(--font-h3-size);
    font-weight: var(--font-h3-weight);
    line-height: var(--font-h3-line-height);
    margin-bottom: var(--spacing-md);
  }

  /* Heading H4 - Minor headings */
  h4, .h4 {
    font-size: var(--font-h4-size);
    font-weight: var(--font-h4-weight);
    line-height: var(--font-h4-line-height);
    margin-bottom: var(--spacing-sm);
  }

  /* Body text - Default paragraph text */
  p, .body {
    font-size: var(--font-body-size);
    font-weight: var(--font-body-weight);
    line-height: var(--font-body-line-height);
    margin-bottom: var(--spacing-md);
  }

  /* Body small - Secondary text, descriptions */
  .body-sm, small {
    font-size: var(--font-body-sm-size);
    font-weight: var(--font-body-sm-weight);
    line-height: var(--font-body-sm-line-height);
  }

  /* Caption - Metadata, timestamps, helper text */
  .caption, figcaption {
    font-size: var(--font-caption-size);
    font-weight: var(--font-caption-weight);
    line-height: var(--font-caption-line-height);
    color: var(--text-muted);
  }

  /* Label - Form labels, badges */
  label, .label {
    font-size: var(--font-label-size);
    font-weight: var(--font-label-weight);
    line-height: var(--font-label-line-height);
  }

  /* Responsive typography adjustments */
  @media (max-width: 768px) {
    h1, .h1 {
      font-size: calc(var(--font-h1-size) * 0.875);
    }

    h2, .h2 {
      font-size: calc(var(--font-h2-size) * 0.875);
    }

    h3, .h3 {
      font-size: calc(var(--font-h3-size) * 0.875);
    }

    h4, .h4 {
      font-size: calc(var(--font-h4-size) * 0.875);
    }
  }
`;

/**
 * Typography scale helper for inline styles
 * Usage: getTypographyStyle('h1') returns CSS properties object
 */
export function getTypographyStyle(level) {
  const styles = {
    h1: {
      fontSize: 'var(--font-h1-size)',
      fontWeight: 'var(--font-h1-weight)',
      lineHeight: 'var(--font-h1-line-height)',
    },
    h2: {
      fontSize: 'var(--font-h2-size)',
      fontWeight: 'var(--font-h2-weight)',
      lineHeight: 'var(--font-h2-line-height)',
    },
    h3: {
      fontSize: 'var(--font-h3-size)',
      fontWeight: 'var(--font-h3-weight)',
      lineHeight: 'var(--font-h3-line-height)',
    },
    h4: {
      fontSize: 'var(--font-h4-size)',
      fontWeight: 'var(--font-h4-weight)',
      lineHeight: 'var(--font-h4-line-height)',
    },
    body: {
      fontSize: 'var(--font-body-size)',
      fontWeight: 'var(--font-body-weight)',
      lineHeight: 'var(--font-body-line-height)',
    },
    'body-sm': {
      fontSize: 'var(--font-body-sm-size)',
      fontWeight: 'var(--font-body-sm-weight)',
      lineHeight: 'var(--font-body-sm-line-height)',
    },
    caption: {
      fontSize: 'var(--font-caption-size)',
      fontWeight: 'var(--font-caption-weight)',
      lineHeight: 'var(--font-caption-line-height)',
    },
    label: {
      fontSize: 'var(--font-label-size)',
      fontWeight: 'var(--font-label-weight)',
      lineHeight: 'var(--font-label-line-height)',
    },
  };

  return styles[level] || styles.body;
}
