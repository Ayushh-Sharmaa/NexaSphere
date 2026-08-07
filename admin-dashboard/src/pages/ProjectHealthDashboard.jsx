import { useState, useEffect } from "react";
import { api } from "../services/api";
import { DashboardCardSkeleton } from "../components/DashboardCardSkeleton";
import { AdminIcon } from "../components/AdminIcon";

const STATUS_STYLES = {
  healthy: { color: "#22c55e", label: "Healthy" },
  attention: { color: "#eab308", label: "Needs Attention" },
};

const ALERT_ICON = {
  warning: "Shield",
  info: "Pin",
  critical: "Shield",
};

export function ProjectHealthDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.projectHealth
      .getOverview()
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load project health data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const status = data
    ? (STATUS_STYLES[data.overallStatus] ?? STATUS_STYLES.healthy)
    : null;

  return (
    <div className="page">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2 className="page-title">Project Health</h2>
        {status && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "999px",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: status.color,
              border: `1px solid ${status.color}`,
              background: `${status.color}1a`,
            }}
          >
            {status.label}
          </span>
        )}
      </div>

      {error && (
        <div
          style={{
            padding: "10px 16px",
            marginBottom: "20px",
            borderRadius: "8px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "rgba(239,68,68,0.9)",
            fontSize: "0.85rem",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="stats-grid">
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
        </div>
      ) : (
        data && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-icon">
                  <AdminIcon name="Calendar" size={28} aria-hidden="true" />
                </span>
                <div>
                  <div className="stat-value">{data.events.total}</div>
                  <div className="stat-label">Total Events</div>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">
                  <AdminIcon name="Clock" size={28} aria-hidden="true" />
                </span>
                <div>
                  <div className="stat-value">{data.events.upcoming}</div>
                  <div className="stat-label">Upcoming Events</div>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">
                  <AdminIcon name="Users" size={28} aria-hidden="true" />
                </span>
                <div>
                  <div className="stat-value">{data.coreTeam.total}</div>
                  <div className="stat-label">Core Team</div>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">
                  <AdminIcon
                    name="MessageSquare"
                    size={28}
                    aria-hidden="true"
                  />
                </span>
                <div>
                  <div className="stat-value">{data.moderation.pending}</div>
                  <div className="stat-label">Pending Moderation</div>
                </div>
              </div>
            </div>

            <div className="quick-links">
              <h3>Alerts</h3>
              {data.alerts.length === 0 ? (
                <p style={{ opacity: 0.7, fontSize: "0.85rem" }}>
                  No issues detected across events, team, or moderation.
                </p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {data.alerts.map((alert, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 14px",
                        marginBottom: "8px",
                        borderRadius: "8px",
                        background: "rgba(148,163,184,0.08)",
                        fontSize: "0.85rem",
                      }}
                    >
                      <AdminIcon
                        name={ALERT_ICON[alert.severity] ?? "Pin"}
                        size={16}
                        aria-hidden="true"
                      />
                      {alert.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )
      )}
    </div>
  );
}
