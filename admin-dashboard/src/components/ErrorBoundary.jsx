/**
 * ErrorBoundary — Reusable React error boundary for admin-dashboard.
 *
 * Catches JavaScript errors in its child component tree and displays a
 * fallback UI. No Sentry dependency (admin-dashboard doesn't use Sentry).
 *
 * Props:
 *   fallback  - Custom fallback element/component (receives { error, resetError })
 *   onError   - Optional callback invoked with (error, errorInfo)
 *   children  - Component tree to guard
 */

import React from "react";

const ALERT_TRIANGLE = (
  <svg
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="var(--c1, #CC1111)"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

function DefaultFallback({ error, resetError }) {
  const isDev = typeof import.meta !== "undefined" && import.meta.env?.DEV;

  return (
    <div
      role="alert"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "60px 24px",
        minHeight: "300px",
      }}
    >
      <div style={{ marginBottom: "16px" }}>{ALERT_TRIANGLE}</div>

      <h2
        style={{
          fontSize: "1.25rem",
          fontWeight: 700,
          color: "var(--text, #e2e8f0)",
          marginBottom: "10px",
        }}
      >
        Something went wrong
      </h2>

      <p
        style={{
          fontSize: "0.9rem",
          color: "var(--text-secondary, #94a3b8)",
          maxWidth: "400px",
          lineHeight: 1.6,
          marginBottom: "20px",
        }}
      >
        An unexpected error occurred while loading this page. Please try again.
      </p>

      {error && isDev && (
        <details
          style={{
            whiteSpace: "pre-wrap",
            background: "var(--surface, #1e293b)",
            padding: "10px 14px",
            borderRadius: "6px",
            maxWidth: "480px",
            marginBottom: "20px",
            fontSize: "0.8rem",
            fontFamily: "monospace",
            color: "#ff5555",
            textAlign: "left",
            border: "1px solid rgba(255,68,68,0.15)",
            width: "100%",
          }}
        >
          <summary
            style={{ cursor: "pointer", fontWeight: 600, marginBottom: "6px" }}
          >
            Error Details
          </summary>
          {error.toString()}
        </details>
      )}

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <button
          onClick={resetError}
          className="btn btn-primary"
          aria-label="Retry"
          style={{ cursor: "pointer" }}
        >
          Try Again
        </button>
        <button
          onClick={() => {
            window.location.href = "/dashboard";
          }}
          aria-label="Go to dashboard"
          style={{
            cursor: "pointer",
            padding: "0.6rem 1.2rem",
            fontSize: "0.85rem",
            background: "var(--surface2, #334155)",
            color: "var(--text, #e2e8f0)",
            border: "1px solid var(--surface2, #334155)",
            borderRadius: "6px",
          }}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught:", error, errorInfo);
    }
    if (typeof this.props.onError === "function") {
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
        if (typeof fallback === "function") {
          return fallback({ error, resetError: this.resetError });
        }
      }

      return <DefaultFallback error={error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
