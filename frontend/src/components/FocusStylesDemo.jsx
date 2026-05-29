/**
 * FocusStylesDemo Component
 * 
 * This component demonstrates the custom focus styles applied to all form elements.
 * It's useful for visual testing and accessibility audits.
 * 
 * Usage: Import and render this component in development to test focus styles.
 */

const styles = {
  container: {
    maxWidth: 600,
    margin: '2rem auto',
    padding: '2rem',
    background: 'var(--bg)',
    color: 'var(--text)',
  },
  section: {
    marginBottom: '2rem',
    padding: '1.5rem',
    background: 'var(--input-bg)',
    borderRadius: 8,
  },
  heading: {
    color: 'var(--text)',
    marginBottom: '1rem',
    fontSize: '1.2rem',
  },
  label: {
    display: 'block',
    color: 'var(--text-muted)',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
  },
  input: {
    width: '100%',
    padding: '0.6rem 0.75rem',
    background: 'var(--input-bg)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    color: 'var(--text)',
    fontSize: '1rem',
    marginBottom: '1rem',
  },
  textarea: {
    width: '100%',
    padding: '0.6rem 0.75rem',
    background: 'var(--input-bg)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    color: 'var(--text)',
    fontSize: '1rem',
    marginBottom: '1rem',
    minHeight: 100,
    fontFamily: 'inherit',
  },
  select: {
    width: '100%',
    padding: '0.6rem 0.75rem',
    background: 'var(--input-bg)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    color: 'var(--text)',
    fontSize: '1rem',
    marginBottom: '1rem',
  },
  button: {
    padding: '0.6rem 1.5rem',
    background: 'var(--btn-primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: '1rem',
    marginRight: '0.5rem',
    marginBottom: '0.5rem',
  },
  buttonSecondary: {
    padding: '0.6rem 1.5rem',
    background: 'transparent',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    fontSize: '1rem',
    marginRight: '0.5rem',
    marginBottom: '0.5rem',
  },
  info: {
    padding: '1rem',
    background: '#0c4a6e',
    color: '#7dd3fc',
    borderRadius: 6,
    fontSize: '0.9rem',
    marginBottom: '2rem',
  },
};

export default function FocusStylesDemo() {
  return (
    <div style={styles.container}>
      <h1 style={{ ...styles.heading, fontSize: '1.8rem', marginBottom: '1.5rem' }}>
        Focus Styles Demo
      </h1>
      
      <div style={styles.info}>
        <strong>Instructions:</strong> Press Tab to navigate through the form elements below.
        Each element should display a consistent, visible focus indicator with a blue ring.
      </div>

      <div style={styles.section}>
        <h2 style={styles.heading}>Text Inputs</h2>
        
        <label style={styles.label} htmlFor="demo-text">
          Text Input
        </label>
        <input
          id="demo-text"
          type="text"
          style={styles.input}
          placeholder="Focus me with Tab"
        />

        <label style={styles.label} htmlFor="demo-email">
          Email Input
        </label>
        <input
          id="demo-email"
          type="email"
          style={styles.input}
          placeholder="email@example.com"
        />

        <label style={styles.label} htmlFor="demo-date">
          Date Input
        </label>
        <input
          id="demo-date"
          type="date"
          style={styles.input}
        />

        <label style={styles.label} htmlFor="demo-readonly">
          Readonly Input
        </label>
        <input
          id="demo-readonly"
          type="text"
          style={styles.input}
          value="This is readonly"
          readOnly
        />
      </div>

      <div style={styles.section}>
        <h2 style={styles.heading}>Textarea</h2>
        
        <label style={styles.label} htmlFor="demo-textarea">
          Textarea
        </label>
        <textarea
          id="demo-textarea"
          style={styles.textarea}
          placeholder="Enter multiple lines of text..."
        />
      </div>

      <div style={styles.section}>
        <h2 style={styles.heading}>Select Dropdown</h2>
        
        <label style={styles.label} htmlFor="demo-select">
          Select
        </label>
        <select id="demo-select" style={styles.select}>
          <option>Option 1</option>
          <option>Option 2</option>
          <option>Option 3</option>
        </select>
      </div>

      <div style={styles.section}>
        <h2 style={styles.heading}>Buttons</h2>
        
        <button style={styles.button}>
          Primary Button
        </button>
        
        <button style={styles.buttonSecondary}>
          Secondary Button
        </button>
        
        <button style={{ ...styles.button, opacity: 0.5 }} disabled>
          Disabled Button
        </button>
      </div>

      <div style={styles.section}>
        <h2 style={styles.heading}>Focus Indicator Specifications</h2>
        <ul style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          <li>Form inputs use a 2px box-shadow ring with 2px offset</li>
          <li>Buttons use a 2px outline with 2px offset</li>
          <li>Focus ring color: <code>--focus-ring</code> (blue in light mode, lighter blue in dark mode)</li>
          <li>Contrast ratio: Meets WCAG 3:1 minimum requirement</li>
          <li>Consistent across all form elements</li>
          <li>Visible in both light and dark modes</li>
        </ul>
      </div>
    </div>
  );
}
