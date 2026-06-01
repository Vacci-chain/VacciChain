import { useButtonState } from '../hooks/useButtonState';

const STATE_LABELS = {
  loading: { icon: '⏳', suffix: '…' },
  success: { icon: '✅', suffix: '' },
  error:   { icon: '❌', suffix: '' },
};

const STATE_STYLES = {
  idle:    {},
  loading: { opacity: 0.8, cursor: 'not-allowed' },
  success: { background: '#16a34a' },
  error:   { background: '#dc2626' },
};

/**
 * Button with idle → loading → success/error → idle feedback states.
 *
 * Props:
 *   onClick  - async function to run (required)
 *   style    - base inline style object
 *   children - idle label
 *   loadingLabel / successLabel / errorLabel - override state labels
 *   resetDelay - ms before returning to idle (default 2000)
 *   ...rest  - forwarded to <button>
 */
export default function FeedbackButton({
  onClick,
  style = {},
  children,
  loadingLabel,
  successLabel,
  errorLabel,
  resetDelay = 2000,
  ...rest
}) {
  const { state, run, buttonProps } = useButtonState(resetDelay);

  const handleClick = () => run(onClick);

  const label = (() => {
    if (state === 'loading') return loadingLabel ?? `${STATE_LABELS.loading.icon} ${children}${STATE_LABELS.loading.suffix}`;
    if (state === 'success') return successLabel ?? `${STATE_LABELS.success.icon} Success`;
    if (state === 'error')   return errorLabel   ?? `${STATE_LABELS.error.icon} Error`;
    return children;
  })();

  // Fixed min-width prevents layout shift between states
  const baseMinWidth = style.minWidth ?? '10rem';

  return (
    <button
      {...rest}
      {...buttonProps}
      onClick={handleClick}
      style={{
        ...style,
        ...STATE_STYLES[state],
        minWidth: baseMinWidth,
        boxSizing: 'border-box',
      }}
    >
      {label}
    </button>
  );
}
