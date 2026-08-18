/**
 * ErrorBoundary (common) — Reusable React error boundary.
 *
 * Upgraded from a basic reload-only implementation to a full-featured
 * boundary: supports resetError, onError callback prop, dev-only error
 * details, proper accessible role="alert" on the fallback, and Sentry tracking.
 *
 * Props:
 *   fallback  - Custom fallback element/component (receives { error, resetError })
 *   onError   - Optional callback invoked with (error, errorInfo)
 *   children  - Component tree to guard
 *
 * Usage:
 *   <ErrorBoundary>
 *     <MyComponent />
 *   </ErrorBoundary>
 *
 *   <ErrorBoundary fallback={({ error, resetError }) => <CustomUI />}>
 *     <HeavyWidget />
 *   </ErrorBoundary>
 */

import React from 'react';
import { captureHandledException } from '../../utils/errorTracking';
import { DynamicIcon } from '../../shared/Icons';
import PageError from '../PageError';

function DefaultFallback({ error, resetError }) {
  return (
    <PageError
      error={error}
      onRetry={resetError}
      onGoHome={() => {
        window.location.href = '/';
      }}
    />
  );
}

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    captureHandledException(error, `React ErrorBoundary: ${errorInfo?.componentStack || ''}`);
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    if (typeof this.props.onError === 'function') {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      const { fallback } = this.props;

      if (fallback) {
        if (React.isValidElement(fallback)) {
          return fallback;
        }
        if (typeof fallback === 'function') {
          return fallback({ error, resetError: this.resetError });
        }
      }

      return <DefaultFallback error={error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
