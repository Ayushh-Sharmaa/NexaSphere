import React from 'react';
import * as Sentry from '@sentry/react';
import { captureHandledException } from '../utils/errorTracking';

function ErrorBoundaryFallback({ error, resetError }) {
  // Read theme from localStorage (set by the theme persistence fix)
  const isDark =
    localStorage.getItem('theme') === 'dark' ||
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
        color: isDark ? '#e5e5e5' : '#1a1a1a',
        transition: 'background-color 0.2s, color 0.2s',
      }}
    >
      <h1>Oops! Something went wrong</h1>
      <p>
        We've been notified of the issue and are working to fix it. Please try refreshing the page.
      </p>
      {error && (
        <details
          style={{
            marginTop: '1rem',
            maxWidth: '700px',
            width: '100%',
            textAlign: 'left',
          }}
        >
          <summary>Error Details</summary>
          <pre
            style={{
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              backgroundColor: isDark ? '#2a2a2a' : '#ebebeb',
              color: isDark ? '#e5e5e5' : '#1a1a1a',
              padding: '1rem',
              borderRadius: '6px',
            }}
          >
            {error.toString()}
            {'\n'}
            {error.stack}
          </pre>
        </details>
      )}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '2rem',
        }}
      >
        <button
          onClick={resetError}
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: isDark ? '#3a3a3a' : '#e0e0e0',
            color: isDark ? '#e5e5e5' : '#1a1a1a',
          }}
        >
          Try Again
        </button>
        <a
          href="/"
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '6px',
            textDecoration: 'none',
            backgroundColor: isDark ? '#2563eb' : '#3b82f6',
            color: '#ffffff',
          }}
        >
          Go Home
        </a>
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    captureHandledException(error, `React Error Boundary: ${errorInfo.componentStack}`);
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorBoundaryFallback error={this.state.error} resetError={this.resetError} />;
    }
    return this.props.children;
  }
}

export default Sentry.withErrorBoundary(ErrorBoundary, {
  fallback: <ErrorBoundaryFallback />,
  showDialog: false,
});
