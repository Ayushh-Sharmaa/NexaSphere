/**
 * BackupsManager.jsx
 * Admin dashboard page for backup management and recovery (Point-In-Time-Recovery / PITR).
 */

import { useState, useEffect, useCallback } from "react";
import { AdminIcon } from "../components/AdminIcon";
import { useToast } from "../hooks/useToast";
import { api } from "../services/api";

function formatBytes(bytes, decimals = 2) {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString();
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ color: color || "var(--red)" }}>
        <AdminIcon name={icon} size={22} aria-hidden="true" />
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export function BackupsManager() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [error, setError] = useState(null);

  const [backups, setBackups] = useState([]);
  const [storageStats, setStorageStats] = useState(null);
  const [restoreLogs, setRestoreLogs] = useState([]);

  const [pitrTimestamp, setPitrTimestamp] = useState("");
  const [backupType, setBackupType] = useState("full");

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [backupsRes, logsRes] = await Promise.all([
        api.backups.get(),
        api.backups.getRestoreHistory(),
      ]);
      setBackups(backupsRes.backups || []);
      setStorageStats(backupsRes.stats || null);
      setRestoreLogs(logsRes.history || []);
      setError(null);
    } catch (err) {
      if (!silent) setError(err.message || "Failed to load backup details");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleManualBackup = async () => {
    setActionLoading(true);
    setActionMessage("");
    try {
      const res = await api.backups.runManual(backupType);
      showToast(`Backup completed successfully! Key: ${res.key}`, "success");
      setActionMessage(`Backup completed successfully! Key: ${res.key}`);
      loadData(true);
    } catch (err) {
      showToast(`Backup failed: ${err.message}`, "error");
      setActionMessage(`Backup failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (backupKey) => {
    if (
      !window.confirm(
        `⚠️ WARNING: Are you sure you want to restore the database from backup: "${backupKey}"? This will overwrite active table contents.`
      )
    ) {
      return;
    }
    setActionLoading(true);
    setActionMessage("");
    try {
      const res = await api.backups.restore(backupKey);
      const dur = res?.result?.durationMs || 0;
      showToast(`Restore completed in ${dur}ms.`, "success");
      setActionMessage(`Restore completed in ${dur}ms.`);
      loadData(true);
    } catch (err) {
      showToast(`Restore failed: ${err.message}`, "error");
      setActionMessage(`Restore failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePITR = async () => {
    if (!pitrTimestamp) {
      alert("Please select a target date and time.");
      return;
    }
    if (
      !window.confirm(
        `⚠️ WARNING: Are you sure you want to perform Point-in-Time Recovery to target: "${pitrTimestamp}"?`
      )
    ) {
      return;
    }
    setActionLoading(true);
    setActionMessage("");
    try {
      await api.backups.restorePITR(new Date(pitrTimestamp).toISOString());
      showToast(
        `Database successfully restored back to ${pitrTimestamp}.`,
        "success"
      );
      setActionMessage(
        `Database successfully restored back to ${pitrTimestamp}.`
      );
      loadData(true);
    } catch (err) {
      showToast(`PITR failed: ${err.message}`, "error");
      setActionMessage(`PITR failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBackup = async (key) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete this backup file?`
      )
    ) {
      return;
    }
    setActionLoading(true);
    setActionMessage("");
    try {
      await api.backups.delete(key);
      showToast(`Backup snapshot deleted successfully.`, "success");
      setActionMessage(`Backup snapshot deleted successfully.`);
      loadData(true);
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, "error");
      setActionMessage(`Delete failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Backup & Recovery</h1>
          <p className="page-subtitle">
            Configure point-in-time recovery, execute manual backups, and review
            verification histories.
          </p>
        </div>
        <button
          className="btn-secondary"
          onClick={() => loadData()}
          aria-label="Refresh backups list"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <AdminIcon name="RefreshCw" size={14} />
          Refresh
        </button>
      </div>

      {error && <div className="page-error">Error: {error}</div>}

      {actionMessage && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            background: "rgba(204, 17, 17, 0.1)",
            color: "var(--admin-accent, #CC1111)",
            border: "1px solid rgba(204, 17, 17, 0.25)",
            marginBottom: "20px",
            fontSize: "0.88rem",
            fontWeight: 500,
          }}
        >
          {actionMessage}
        </div>
      )}

      {loading && <p>Loading backups data...</p>}
      {actionLoading && <p>Processing database action...</p>}

      {!loading && (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* Storage stats */}
          {storageStats && (
            <div
              className="stats-grid"
              style={{
                gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
              }}
            >
              <StatCard
                icon="Database"
                label="Total Backups Volume"
                value={formatBytes(storageStats.totalSize)}
                color="#3b82f6"
              />
              <StatCard
                icon="FileText"
                label="Snapshots Stored"
                value={storageStats.totalCount}
                color="#10b981"
              />
              <div className="stat-card" style={{ gridColumn: "span 2" }}>
                <div className="stat-icon" style={{ color: "#a78bfa" }}>
                  <AdminIcon name="Shield" size={22} aria-hidden="true" />
                </div>
                <div style={{ width: "100%" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: "700",
                        color: "#fff",
                      }}
                    >
                      Storage Target: {storageStats.storageType}
                    </span>
                    <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                      {storageStats.utilizationPercentage}% Used
                    </span>
                  </div>
                  <div
                    style={{
                      height: "8px",
                      background: "rgba(255,255,255,0.08)",
                      borderRadius: "4px",
                      marginTop: "0.4rem",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${storageStats.utilizationPercentage}%`,
                        background: "linear-gradient(90deg, #60a5fa, #8b5cf6)",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Backup Action forms */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: "1.5rem",
            }}
          >
            <div
              className="stat-card"
              style={{
                flexDirection: "column",
                alignItems: "stretch",
                gap: "12px",
                padding: "24px",
              }}
            >
              <div className="chart-header" style={{ marginBottom: "8px" }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  Manual Snapshot Backup
                </h3>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "0.8rem",
                    color: "var(--text-muted, #888)",
                  }}
                >
                  Run immediate backup of database or uploaded media.
                </p>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <label style={{ fontSize: "0.8rem", color: "var(--text)" }}>
                  Target Backup Type:
                </label>
                <select
                  value={backupType}
                  onChange={(e) => setBackupType(e.target.value)}
                  style={{
                    background: "var(--surface)",
                    color: "var(--text)",
                    border: "1px solid var(--border)",
                    padding: "8px 12px",
                    borderRadius: "var(--radius, 6px)",
                    fontSize: "0.88rem",
                  }}
                >
                  <option value="full">Database Full Backup (.enc)</option>
                  <option value="incremental">
                    Database Incremental Backup (.enc)
                  </option>
                  <option value="trlog">Database Transaction Log (.enc)</option>
                  <option value="files">File Storage uploads/ Sync</option>
                </select>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleManualBackup}
                disabled={actionLoading}
                style={{ marginTop: "8px", padding: "10px" }}
              >
                Execute Backup
              </button>
            </div>

            <div
              className="stat-card"
              style={{
                flexDirection: "column",
                alignItems: "stretch",
                gap: "12px",
                padding: "24px",
              }}
            >
              <div className="chart-header" style={{ marginBottom: "8px" }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  Point-in-Time Recovery (PITR)
                </h3>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "0.8rem",
                    color: "var(--text-muted, #888)",
                  }}
                >
                  Restore database back to any state in the last 7 days.
                </p>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <label style={{ fontSize: "0.8rem", color: "var(--text)" }}>
                  Recovery Time stamp:
                </label>
                <input
                  type="datetime-local"
                  value={pitrTimestamp}
                  onChange={(e) => setPitrTimestamp(e.target.value)}
                  style={{
                    background: "var(--surface)",
                    color: "var(--text)",
                    border: "1px solid var(--border)",
                    padding: "8px 12px",
                    borderRadius: "var(--radius, 6px)",
                    fontSize: "0.88rem",
                  }}
                />
              </div>
              <button
                className="btn btn-secondary"
                onClick={handlePITR}
                disabled={actionLoading}
                style={{
                  marginTop: "8px",
                  padding: "10px",
                  color: "#fbbf24",
                  borderColor: "rgba(245,158,11,0.5)",
                }}
              >
                Perform PITR Restore
              </button>
            </div>
          </div>

          {/* Stored backups list table */}
          <div
            className="stat-card"
            style={{
              flexDirection: "column",
              alignItems: "stretch",
              padding: "24px",
            }}
          >
            <div className="chart-header" style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
                Stored Backup Snapshots
              </h3>
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "0.8rem",
                  color: "var(--text-muted, #888)",
                }}
              >
                AES-256 encrypted database dumps and configuration files stored
                securely.
              </p>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                }}
                className="tasks-table"
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--border)",
                      color: "var(--text2)",
                      fontSize: "0.85rem",
                    }}
                  >
                    <th style={{ padding: "10px" }}>Filename / Key</th>
                    <th style={{ padding: "10px" }}>Backup Type</th>
                    <th style={{ padding: "10px" }}>Compressed Size</th>
                    <th style={{ padding: "10px" }}>Storage Region</th>
                    <th style={{ padding: "10px" }}>Created At</th>
                    <th style={{ padding: "10px", textAlign: "right" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {backups.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        style={{
                          padding: "2rem",
                          textAlign: "center",
                          opacity: 0.5,
                        }}
                      >
                        No backups stored. Run a manual backup above to create
                        one.
                      </td>
                    </tr>
                  ) : (
                    backups.map((backup) => (
                      <tr
                        key={backup.key}
                        style={{
                          borderBottom: "1px solid var(--border)",
                          fontSize: "0.88rem",
                        }}
                      >
                        <td style={{ padding: "12px 10px" }}>
                          <code style={{ fontSize: "0.8rem", color: "#fff" }}>
                            {backup.filename}
                          </code>
                        </td>
                        <td style={{ padding: "12px 10px" }}>
                          <span
                            style={{
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              background:
                                backup.type === "full"
                                  ? "rgba(59,130,246,0.15)"
                                  : "rgba(139,92,246,0.15)",
                              color:
                                backup.type === "full" ? "#60a5fa" : "#a78bfa",
                            }}
                          >
                            {backup.type.toUpperCase()}
                          </span>
                        </td>
                        <td
                          style={{ padding: "12px 10px", color: "var(--text)" }}
                        >
                          {formatBytes(backup.size)}
                        </td>
                        <td style={{ padding: "12px 10px" }}>
                          {backup.location === "s3"
                            ? "AWS S3 Redundant"
                            : "Local Storage"}
                        </td>
                        <td
                          style={{
                            padding: "12px 10px",
                            color: "var(--text2)",
                          }}
                        >
                          {formatDate(backup.date)}
                        </td>
                        <td
                          style={{ padding: "12px 10px", textAlign: "right" }}
                        >
                          <div
                            style={{ display: "inline-flex", gap: "0.5rem" }}
                          >
                            <button
                              className="btn btn-outline"
                              onClick={() => handleRestore(backup.key)}
                              style={{
                                padding: "4px 8px",
                                fontSize: "0.75rem",
                                color: "#34d399",
                                borderColor: "rgba(52,211,153,0.4)",
                                background: "transparent",
                              }}
                            >
                              Restore
                            </button>
                            <button
                              className="btn btn-outline"
                              onClick={() => handleDeleteBackup(backup.key)}
                              style={{
                                padding: "4px 8px",
                                fontSize: "0.75rem",
                                color: "#ef4444",
                                borderColor: "rgba(239,68,68,0.4)",
                                background: "transparent",
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Automated recovery verification history */}
          <div
            className="stat-card"
            style={{
              flexDirection: "column",
              alignItems: "stretch",
              padding: "24px",
            }}
          >
            <div className="chart-header" style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
                Automated Recovery Verification History
              </h3>
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "0.8rem",
                  color: "var(--text-muted, #888)",
                }}
              >
                History of monthly recovery verification tests asserting backup
                structural consistency and RTO/RPO metrics.
              </p>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                }}
                className="tasks-table"
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--border)",
                      color: "var(--text2)",
                      fontSize: "0.85rem",
                    }}
                  >
                    <th style={{ padding: "10px" }}>Test Time</th>
                    <th style={{ padding: "10px" }}>Backup Key Evaluated</th>
                    <th style={{ padding: "10px" }}>Restore Type</th>
                    <th style={{ padding: "10px" }}>Status</th>
                    <th style={{ padding: "10px" }}>Duration</th>
                    <th style={{ padding: "10px" }}>Details / Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {restoreLogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        style={{
                          padding: "2rem",
                          textAlign: "center",
                          opacity: 0.5,
                        }}
                      >
                        No recovery verification runs found.
                      </td>
                    </tr>
                  ) : (
                    restoreLogs.map((log) => (
                      <tr
                        key={log.id || log.verified_at}
                        style={{
                          borderBottom: "1px solid var(--border)",
                          fontSize: "0.88rem",
                        }}
                      >
                        <td
                          style={{
                            padding: "12px 10px",
                            color: "var(--text2)",
                          }}
                        >
                          {formatDate(log.verified_at)}
                        </td>
                        <td style={{ padding: "12px 10px" }}>
                          <code style={{ fontSize: "0.8rem" }}>
                            {log.backup_key || "N/A"}
                          </code>
                        </td>
                        <td style={{ padding: "12px 10px" }}>
                          {log.restore_type}
                        </td>
                        <td style={{ padding: "12px 10px" }}>
                          <span
                            style={{
                              color:
                                log.status === "success"
                                  ? "#34d399"
                                  : "#f87171",
                              fontWeight: "600",
                              fontSize: "0.85rem",
                            }}
                          >
                            {log.status === "success" ? "PASSED" : "FAILED"}
                          </span>
                        </td>
                        <td
                          style={{ padding: "12px 10px", color: "var(--text)" }}
                        >
                          {log.duration_ms}ms
                        </td>
                        <td
                          style={{
                            padding: "12px 10px",
                            color: log.error_message
                              ? "#fca5a5"
                              : "var(--text2)",
                            fontSize: "0.85rem",
                          }}
                        >
                          {log.error_message ||
                            "Verification checks passed (RTO < 1 hour, table structural schema validated)"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
