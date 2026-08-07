import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { useLogoutAwareInterval } from "../hooks/useLogoutAwareInterval";

const STATE_COLORS = {
  CLOSED: "#22c55e",
  OPEN: "#ef4444",
  HALF_OPEN: "#f59e0b",
};

function StatusBadge({ state }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: "12px",
        fontSize: "0.75rem",
        fontWeight: 600,
        color: "#fff",
        backgroundColor: STATE_COLORS[state] || "#6b7280",
      }}
    >
      {state}
    </span>
  );
}

export function CircuitBreakerManager() {
  const [breakers, setBreakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setError(null);
      const data = await api.circuitBreaker.getMetrics();
      setBreakers(data?.circuitBreakers || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useLogoutAwareInterval(fetchMetrics, 5000);

  async function handleReset(name) {
    try {
      await api.circuitBreaker.reset(name);
      setActionMsg(`Reset "${name}"`);
      setTimeout(() => setActionMsg(null), 3000);
      fetchMetrics();
    } catch (e) {
      setActionMsg(`Failed: ${e.message}`);
    }
  }

  async function handleRetry(name) {
    try {
      const data = await api.circuitBreaker.retry(name);
      setActionMsg(
        data.ok ? `Retried "${name}" → ${data.state}` : `Failed: ${data.error}`
      );
      setTimeout(() => setActionMsg(null), 3000);
      fetchMetrics();
    } catch (e) {
      setActionMsg(`Failed: ${e.message}`);
    }
  }

  return (
    <div className="admin-page">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <h2 style={{ margin: 0 }}>Circuit Breaker Status</h2>
        <button
          className="btn btn-secondary"
          onClick={fetchMetrics}
          style={{ padding: "6px 14px", fontSize: "0.8rem" }}
        >
          Refresh
        </button>
      </div>

      {actionMsg && (
        <div
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            background: "rgba(204, 17, 17, 0.1)",
            color: "var(--admin-accent, #CC1111)",
            marginBottom: "16px",
            fontSize: "0.85rem",
          }}
        >
          {actionMsg}
        </div>
      )}

      {loading && <p>Loading circuit breaker metrics…</p>}
      {error && <p style={{ color: "#ef4444" }}>Error: {error}</p>}

      {!loading && !error && breakers.length === 0 && (
        <p>No circuit breakers registered.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {breakers.map((b) => (
          <div
            key={b.name}
            style={{
              background: "var(--admin-card-bg, rgba(255,255,255,0.04))",
              border: "1px solid var(--admin-border, rgba(255,255,255,0.1))",
              borderRadius: "8px",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ minWidth: 160 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{b.name}</div>
              <StatusBadge state={b.state} />
            </div>

            <div
              style={{
                display: "flex",
                gap: "20px",
                fontSize: "0.8rem",
                color: "#aaa",
              }}
            >
              <div>
                <div>Failures</div>
                <div style={{ fontWeight: 600, color: "#fff" }}>
                  {b.failureCount}
                </div>
              </div>
              <div>
                <div>Trips</div>
                <div style={{ fontWeight: 600, color: "#fff" }}>
                  {b.tripCount}
                </div>
              </div>
              <div>
                <div>Threshold</div>
                <div style={{ fontWeight: 600, color: "#fff" }}>
                  {b.failureThreshold}
                </div>
              </div>
              <div>
                <div>Cooldown</div>
                <div style={{ fontWeight: 600, color: "#fff" }}>
                  {b.nextAttemptInMs > 0
                    ? `${(b.nextAttemptInMs / 1000).toFixed(1)}s`
                    : "—"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="btn btn-secondary"
                onClick={() => handleReset(b.name)}
                style={{ padding: "6px 12px", fontSize: "0.75rem" }}
              >
                Reset
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleRetry(b.name)}
                style={{ padding: "6px 12px", fontSize: "0.75rem" }}
              >
                Retry
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
