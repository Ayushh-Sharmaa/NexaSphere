import { useState, useEffect } from "react";
import { api } from "../services/api";

export function AlertManager() {
  const [rules, setRules] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    api.alerts
      .getRules()
      .then((d) => setRules(d.rules || []))
      .catch(() => {});
    api.alerts
      .getEvents()
      .then((d) => setEvents(d.events || []))
      .catch(() => {});
  }, []);

  const toggleRule = (rule) => {
    api.alerts
      .updateRule(rule.id, { enabled: !rule.enabled })
      .then(() => {
        setRules(
          rules.map((r) =>
            r.id === rule.id ? { ...r, enabled: !r.enabled } : r
          )
        );
      })
      .catch(() => {});
  };

  const updateStatus = (eventId, status) => {
    api.alerts
      .updateEventStatus(eventId, status)
      .then(() => {
        setEvents(
          events.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  status,
                  resolvedAt:
                    status === "resolved" ? new Date().toISOString() : null,
                }
              : e
          )
        );
      })
      .catch(() => {});
  };

  return (
    <div>
      <h2 className="section-title">Alert Configuration</h2>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 12" }}>Alert Rules</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Rule</th>
              <th>Threshold</th>
              <th>Severity</th>
              <th>Channels</th>
              <th>Enabled</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id}>
                <td>
                  <span className="badge">{r.category}</span>
                </td>
                <td>{r.label}</td>
                <td>
                  {r.condition} {r.threshold}
                </td>
                <td>
                  <span
                    className={`badge ${r.severity === "Critical" ? "badge-danger" : r.severity === "Warning" ? "badge-warning" : "badge-info"}`}
                  >
                    {r.severity}
                  </span>
                </td>
                <td>{r.channels.join(", ")}</td>
                <td>
                  <button
                    className={`btn btn-sm ${r.enabled ? "btn-success" : "btn-secondary"}`}
                    onClick={() => toggleRule(r)}
                  >
                    {r.enabled ? "Active" : "Disabled"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 style={{ margin: "0 0 12" }}>Alert History</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Message</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  style={{ textAlign: "center", color: "var(--t2)" }}
                >
                  No alerts yet.
                </td>
              </tr>
            )}
            {events.map((e) => (
              <tr key={e.id}>
                <td>
                  <span className="badge">{e.category}</span>
                </td>
                <td>{e.message}</td>
                <td>
                  <span
                    className={`badge ${e.severity === "Critical" ? "badge-danger" : "badge-warning"}`}
                  >
                    {e.severity}
                  </span>
                </td>
                <td>
                  <span
                    className={`badge ${e.status === "triggered" ? "badge-danger" : e.status === "acknowledged" ? "badge-warning" : "badge-success"}`}
                  >
                    {e.status}
                  </span>
                </td>
                <td>
                  {e.status === "triggered" && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => updateStatus(e.id, "acknowledged")}
                      style={{ marginRight: 4 }}
                    >
                      Acknowledge
                    </button>
                  )}
                  {e.status !== "resolved" && (
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => updateStatus(e.id, "resolved")}
                    >
                      Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
