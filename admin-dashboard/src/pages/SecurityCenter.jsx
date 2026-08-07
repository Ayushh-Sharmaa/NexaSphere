import { useEffect, useState } from "react";
import { adminSecurity } from "../services/auth";
import { AdminIcon } from "../components/AdminIcon";

function formatDate(value) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function SecurityCenter() {
  const [overview, setOverview] = useState({ sessions: [], loginHistory: [] });
  const [auditLogs, setAuditLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setError("");
    setLoading(true);
    try {
      const [securityData, auditData] = await Promise.all([
        adminSecurity.getOverview(),
        adminSecurity.searchAuditLogs(search),
      ]);
      setOverview(securityData);
      setAuditLogs(auditData.logs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const revoke = async (sessionId) => {
    try {
      setError(null);
      await adminSecurity.revokeSession(sessionId);
      await load();
    } catch (err) {
      setError(err.message || "Failed to revoke session");
    }
  };

  const logoutOthers = async () => {
    try {
      setError(null);
      await adminSecurity.logoutOtherSessions();
      await load();
    } catch (err) {
      setError(err.message || "Failed to logout other sessions");
    }
  };

  return (
    <div className="page security-page">
      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Security Center</h1>
          <p className="page-subtitle">
            Session timeout: {overview.sessionTimeoutMinutes || 30} minutes
          </p>
        </div>
        <button className="btn-secondary" onClick={logoutOthers}>
          Logout other sessions
        </button>
      </div>

      {error && <div className="page-error">{error}</div>}

      <section className="content-card security-section">
        <div className="security-section-header">
          <h2>Active sessions</h2>
        </div>
        {loading ? (
          <div className="empty-state">Loading sessions...</div>
        ) : (
          <div className="security-list">
            {overview.sessions.map((session) => (
              <div className="security-row" key={session.id}>
                <div className="item-icon">
                  <AdminIcon name="Globe" />
                </div>
                <div className="security-row-main">
                  <div className="item-name">
                    {session.metadata?.device || "Unknown device"}
                    {session.current && (
                      <span className="status-tag success">Current</span>
                    )}
                  </div>
                  <div className="item-meta">
                    {session.metadata?.ip || "Unknown IP"} -{" "}
                    {session.metadata?.location || "Unknown location"} - Last
                    active {formatDate(session.lastSeenAt)}
                  </div>
                </div>
                <button
                  className="btn-secondary"
                  onClick={() => revoke(session.id)}
                  disabled={session.current}
                >
                  Revoke
                </button>
              </div>
            ))}
            {!overview.sessions.length && (
              <div className="empty-state">No active sessions</div>
            )}
          </div>
        )}
      </section>

      <section className="content-card security-section">
        <div className="security-section-header">
          <h2>Login history</h2>
        </div>
        <div className="security-list">
          {overview.loginHistory.map((login) => (
            <div className="security-row" key={login.id}>
              <div className="item-icon">
                <AdminIcon name={login.suspicious ? "Target" : "Clock"} />
              </div>
              <div className="security-row-main">
                <div className="item-name">
                  {login.device}
                  {login.suspicious && (
                    <span className="status-tag info">Suspicious</span>
                  )}
                </div>
                <div className="item-meta">
                  {login.ipAddress} - {login.location} -{" "}
                  {formatDate(login.createdAt)}
                </div>
              </div>
            </div>
          ))}
          {!overview.loginHistory.length && (
            <div className="empty-state">No login history</div>
          )}
        </div>
      </section>

      <section className="content-card security-section">
        <div className="security-section-header">
          <h2>Audit trail</h2>
          <div className="security-actions">
            <input
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit trail"
            />
            <button className="btn-secondary" onClick={load}>
              Search
            </button>
            <a
              className="btn-secondary"
              href={adminSecurity.getAuditExportUrl(search)}
            >
              Export CSV
            </a>
          </div>
        </div>
        <div className="overflow-x">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Admin</th>
                <th>Action</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDate(log.timestamp)}</td>
                  <td>{log.adminId}</td>
                  <td>{log.action}</td>
                  <td>{log.ipAddress || "Unknown"}</td>
                </tr>
              ))}
              {!auditLogs.length && (
                <tr>
                  <td colSpan="4" className="empty-row">
                    No audit entries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
