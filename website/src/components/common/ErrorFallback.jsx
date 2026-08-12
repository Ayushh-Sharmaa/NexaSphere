import React from 'react';
import { DynamicIcon } from '../../shared/Icons';

const fullPageStyles = {
  wrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    width: '100%',
    padding: '24px',
    background: 'var(--bg)',
    boxSizing: 'border-box',
  },
  card: {
    width: '100%',
    maxWidth: '560px',
    background: 'var(--card)',
    border: '1px solid rgba(255,68,68,0.2)',
    borderRadius: '12px',
    padding: '32px 24px',
    textAlign: 'center',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.18)',
  },
};

const sectionStyles = {
  wrapper: {
    minHeight: '400px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '40px 24px',
    background: 'var(--bg)',
    borderRadius: '12px',
    border: '1px solid rgba(255,68,68,0.2)',
    margin: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '560px',
    boxSizing: 'border-box',
  },
};

const titleStyles = {
  marginBottom: '12px',
  color: 'var(--t1)',
  fontFamily: "'Orbitron', monospace",
  fontWeight: 700,
};

const messageStyles = {
  color: 'var(--t2)',
  fontSize: '0.95rem',
  lineHeight: 1.6,
  marginBottom: '24px',
  maxWidth: '460px',
};

const buttonRowStyles = {
  display: 'flex',
  gap: '10px',
  justifyContent: 'center',
  flexWrap: 'wrap',
};

const secondaryButtonStyles = {
  border: '1px solid var(--bdr)',
  background: 'transparent',
  color: 'var(--t2)',
  padding: '10px 16px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 600,
};

const detailsStyles = {
  width: '100%',
  textAlign: 'left',
  border: '1px solid var(--bdr)',
  borderRadius: '8px',
  padding: '10px 12px',
  background: 'rgba(0,0,0,0.12)',
  marginBottom: '20px',
  boxSizing: 'border-box',
};

const stackStyles = {
  marginTop: '10px',
  maxHeight: '220px',
  overflow: 'auto',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  fontSize: '0.78rem',
  lineHeight: 1.5,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  color: 'var(--t2)',
};

export default function ErrorFallback({
  error,
  title = 'Something went wrong',
  message = 'We encountered an unexpected issue. Please refresh the page and try again.',
  fullPage = false,
  showGoHome = true,
  onRefresh,
  onGoHome,
}) {
  const isDevelopment = import.meta.env.DEV;
  const styles = fullPage ? fullPageStyles : sectionStyles;

  const handleRefresh = () => {
    if (typeof onRefresh === 'function') {
      onRefresh();
      return;
    }
    window.location.reload();
  };

  const handleGoHome = () => {
    if (typeof onGoHome === 'function') {
      onGoHome();
      return;
    }
    window.location.assign('/');
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={{ color: '#ff4444', marginBottom: '14px' }}>
          <DynamicIcon name="AlertTriangle" size={52} />
        </div>

        {fullPage ? (
          <h1 style={{ ...titleStyles, fontSize: '2rem' }}>{title}</h1>
        ) : (
          <h2 style={{ ...titleStyles, fontSize: '1.5rem' }}>{title}</h2>
        )}

        <p style={messageStyles}>{message}</p>

        {isDevelopment && error && (
          <details style={detailsStyles}>
            <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--t1)' }}>
              Developer Error Details
            </summary>
            <div
              style={{
                marginTop: '10px',
                color: 'var(--t2)',
                fontSize: '0.88rem',
              }}
            >
              {error?.toString?.() || 'Unknown error'}
            </div>
            {error?.stack && <pre style={stackStyles}>{error.stack}</pre>}
          </details>
        )}

        <div style={buttonRowStyles}>
          <button className="btn btn-primary" onClick={handleRefresh} style={{ cursor: 'pointer' }}>
            Refresh Page
          </button>
          {showGoHome && (
            <button onClick={handleGoHome} style={secondaryButtonStyles}>
              Go Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
