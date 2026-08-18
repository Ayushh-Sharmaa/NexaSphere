import { useState, useEffect } from "react";
import { api } from "../services/api";

export function SubscriptionsManager() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    premium: 0,
    pro: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.subscriptions.getAll();
      const subs = data.subscriptions || [];
      setSubscriptions(subs);
      setStats({
        total: subs.length,
        premium: subs.filter((s) => s.tier === "premium").length,
        pro: subs.filter((s) => s.tier === "pro").length,
        revenue: subs.reduce((sum, s) => sum + (s.price || 0), 0),
      });
    } catch (e) {
      console.error("Failed to load subscriptions", e);
    }
    setLoading(false);
  };

  const tiers = [
    { id: "free", name: "Free", price: 0, color: "#888" },
    { id: "premium", name: "Premium", price: 499, color: "#CC1111" },
    { id: "pro", name: "Pro", price: 999, color: "#eab308" },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Subscriptions</h1>
        <button className="btn btn-primary" onClick={loadData}>
          Refresh
        </button>
      </div>

      {error && (
        <div
          style={{
            color: "#ef4444",
            padding: "12px",
            background: "rgba(239, 68, 68, 0.1)",
            borderRadius: "6px",
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{error}</span>
          <button
            className="btn btn-secondary"
            style={{ fontSize: "0.8rem", padding: "4px 8px" }}
            onClick={loadData}
          >
            Retry
          </button>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div className="card" style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>
            {stats.total}
          </div>
          <div className="text-muted">Total</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "20px" }}>
          <div
            style={{ fontSize: "1.8rem", fontWeight: 700, color: "#CC1111" }}
          >
            {stats.premium}
          </div>
          <div className="text-muted">Premium</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "20px" }}>
          <div
            style={{ fontSize: "1.8rem", fontWeight: 700, color: "#eab308" }}
          >
            {stats.pro}
          </div>
          <div className="text-muted">Pro</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "20px" }}>
          <div
            style={{ fontSize: "1.8rem", fontWeight: 700, color: "#22c55e" }}
          >
            ${(stats.revenue / 100).toFixed(2)}
          </div>
          <div className="text-muted">Monthly Revenue</div>
        </div>
      </div>

      {loading && <p className="text-muted">Loading…</p>}

      {error && (
        <div className="page-error" style={{ marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {!error && (
        <div className="card">
          <h3 style={{ margin: "0 0 16px" }}>All Subscriptions</h3>
          <table
            className="table"
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th style={{ textAlign: "left", padding: "8px" }}>User ID</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Tier</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Status</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Price</th>
                <th style={{ textAlign: "left", padding: "8px" }}>
                  Period End
                </th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: "16px",
                      textAlign: "center",
                      color: "var(--t2)",
                    }}
                  >
                    No subscriptions yet
                  </td>
                </tr>
              )}
              {subscriptions.map((sub) => {
                const tier = tiers.find((t) => t.id === sub.tier) || tiers[0];
                return (
                  <tr
                    key={sub.id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <td style={{ padding: "8px" }}>{sub.userId}</td>
                    <td style={{ padding: "8px" }}>
                      <span
                        className="badge"
                        style={{ background: tier.color, color: "#fff" }}
                      >
                        {tier.name}
                      </span>
                    </td>
                    <td style={{ padding: "8px" }}>
                      <span
                        className={`badge ${sub.status === "active" ? "badge-success" : "badge-secondary"}`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td style={{ padding: "8px" }}>
                      ${(sub.price || 0) / 100}/mo
                    </td>
                    <td style={{ padding: "8px" }}>
                      {sub.currentPeriodEnd
                        ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
