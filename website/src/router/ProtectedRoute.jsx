import React from 'react';

/**
 * Page loading spinner fallback.
 */
export function PageLoadingSpinner() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        color: 'var(--t2)',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '3px solid rgba(204,17,17,0.2)',
          borderTop: '3px solid #CC1111',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>Loading…</span>
    </div>
  );
}

/**
 * Route guard (passthrough when login is disabled).
 */
export function ProtectedRoute({ children }) {
  return children;
}

export default ProtectedRoute;
