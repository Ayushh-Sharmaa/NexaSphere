import { useState, useEffect } from "react";
import { api } from "../services/api";
import { AdminIcon } from "../components/AdminIcon";
import { Skeleton } from "../components/Skeleton";
import { EmptyState } from "../components/EmptyState";

export function SyncMonitor() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resyncing, setResyncing] = useState(false);

  const fetchQueue = () => {
    setLoading(true);
    setError(null);
    api.sync
      .getQueue()
      .then((data) => {
        setQueue(data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load sync queue status");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleRetry = (taskId) => {
    api.sync
      .retry(taskId)
      .then(() => {
        // Optimistically update status in state
        setQueue((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? { ...task, status: "pending", retry_count: 0, last_error: null }
              : task
          )
        );
      })
      .catch((err) => {
        alert("Failed to queue retry: " + err.message);
      });
  };

  const handleFullResync = () => {
    if (
      !window.confirm(
        "Are you sure you want to trigger a full resync? This will enqueue all database records."
      )
    ) {
      return;
    }
    setResyncing(true);
    api.sync
      .resync()
      .then(() => {
        alert("Full resync triggered successfully");
        fetchQueue();
      })
      .catch((err) => {
        alert("Failed to trigger resync: " + err.message);
      })
      .finally(() => {
        setResyncing(false);
      });
  };

  // Group metrics
  const stats = {
    pending: queue.filter((t) => t.status === "pending").length,
    processing: queue.filter((t) => t.status === "processing").length,
    failed: queue.filter((t) => t.status === "failed").length,
    total: queue.length,
  };

  return (
    <div className="page">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <h2 className="page-title" style={{ margin: 0 }}>
          Google Sheets Sync Monitor
        </h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn btn-secondary"
            onClick={fetchQueue}
            disabled={loading}
          >
            <AdminIcon name="RefreshCw" size={16} /> Refresh
          </button>
          <button
            className="btn btn-primary"
            onClick={handleFullResync}
            disabled={resyncing || loading}
          >
            <AdminIcon name="Database" size={16} /> Trigger Full Resync
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: 13,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Pending
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text)" }}>
            {stats.pending}
          </div>
        </div>
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: 13,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Processing
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#3b82f6" }}>
            {stats.processing}
          </div>
        </div>
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: 13,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Failed (DLQ)
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#ef4444" }}>
            {stats.failed}
          </div>
        </div>
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: 13,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Total Queue Items
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text)" }}>
            {stats.total}
          </div>
        </div>
      </div>

      {loading && <Skeleton height={44} count={5} />}

      {!loading && error && (
        <div
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 10,
            padding: "20px 24px",
            color: "#ef4444",
            textAlign: "center",
          }}
        >
          <AdminIcon name="AlertCircle" size={24} />
          <p style={{ marginTop: 8 }}>{error}</p>
        </div>
      )}

      {!loading && !error && queue.length === 0 && (
        <EmptyState
          icon="CheckCircle"
          title="All Synced"
          description="The sync queue is completely empty. All records are currently synchronized."
        />
      )}

      {!loading && !error && queue.length > 0 && (
        <div
          style={{
            overflowX: "auto",
            borderRadius: 12,
            border: "1px solid var(--border)",
          }}
        >
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--surface-elevated, var(--surface))",
                }}
              >
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: 600,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  ID
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: 600,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  Form Type
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: 600,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: 600,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  Retries
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: 600,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  Last Error
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: 600,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {queue.map((task) => (
                <tr
                  key={task.id}
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <td style={{ padding: "12px 16px" }}>{task.id}</td>
                  <td style={{ padding: "12px 16px" }}>{task.form_type}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        background:
                          task.status === "failed"
                            ? "rgba(239,68,68,0.1)"
                            : task.status === "processing"
                              ? "rgba(59,130,246,0.1)"
                              : "rgba(156,163,175,0.1)",
                        color:
                          task.status === "failed"
                            ? "#ef4444"
                            : task.status === "processing"
                              ? "#3b82f6"
                              : "var(--text)",
                      }}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {task.retry_count} / 5
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      maxWidth: 300,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: "var(--text-muted)",
                    }}
                    title={task.last_error}
                  >
                    {task.last_error || "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleRetry(task.id)}
                      disabled={task.status === "processing"}
                    >
                      <AdminIcon name="RefreshCw" size={14} /> Retry
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
