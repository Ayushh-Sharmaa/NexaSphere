import { useState, useEffect, useMemo } from "react";
import { api } from "../services/api";

const STATUS_BADGES = {
  approved: { bg: "#d1fae5", color: "#065f46" },
  rejected: { bg: "#fee2e2", color: "#991b1b" },
  flagged: { bg: "#fef3c7", color: "#92400e" },
  pending: { bg: "#e0e7ff", color: "#3730a3" },
};

export function ForumManager() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [moderating, setModerating] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const loadThreads = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchQuery.trim()) params.q = searchQuery.trim();
      const data = await api.forum.getAll(params);
      setThreads(Array.isArray(data?.threads) ? data.threads : []);
    } catch (err) {
      console.error("Failed to load forum threads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, [statusFilter]);

  const filteredThreads = useMemo(() => {
    let result = threads;
    if (statusFilter) {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase();
    return result.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        t.content?.toLowerCase().includes(q)
    );
  }, [threads, searchQuery, statusFilter]);

  const handleModerate = async (id, status) => {
    setModerating(id);
    try {
      await api.forum.moderate(id, status);
      setThreads((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status } : t))
      );
    } catch (err) {
      console.error("Moderation failed:", err);
    } finally {
      setModerating(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.forum.delete(deleteTarget.id);
      setThreads((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setDeleteError("Failed to delete thread");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Forum Management</h1>
        <p className="page-subtitle">
          Moderate threads, approve or reject content
        </p>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search threads..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid var(--bdr,#ddd)",
            flex: 1,
            fontSize: "0.9rem",
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid var(--bdr,#ddd)",
            fontSize: "0.9rem",
          }}
        >
          <option value="">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="flagged">Flagged</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
          Loading threads...
        </div>
      ) : filteredThreads.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
          No threads found
        </div>
      ) : (
        <div className="list">
          {filteredThreads.map((thread) => (
            <div key={thread.id} className="list-item">
              <div className="list-item-left">
                <div className="list-item-title">{thread.title}</div>
                <div className="list-item-meta">
                  by {thread.authorName} · {thread.categoryName || "General"} ·{" "}
                  {thread.replyCount || 0} replies · {thread.upvotes || 0} votes
                </div>
                <div
                  className="list-item-meta"
                  style={{ fontSize: "0.8rem", marginTop: 4 }}
                >
                  {new Date(thread.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="list-item-right">
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 10px",
                    borderRadius: 12,
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    background: STATUS_BADGES[thread.status]?.bg || "#e5e7eb",
                    color: STATUS_BADGES[thread.status]?.color || "#374151",
                  }}
                >
                  {thread.status}
                </span>
                {thread.status !== "approved" && (
                  <button
                    onClick={() => handleModerate(thread.id, "approved")}
                    className="btn btn-approve"
                    disabled={moderating === thread.id}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 6,
                      border: "none",
                      background: "#065f46",
                      color: "#fff",
                      cursor:
                        moderating === thread.id ? "not-allowed" : "pointer",
                      fontSize: "0.8rem",
                      opacity: moderating === thread.id ? 0.6 : 1,
                    }}
                  >
                    {moderating === thread.id ? "…" : "Approve"}
                  </button>
                )}
                {thread.status !== "flagged" && (
                  <button
                    onClick={() => handleModerate(thread.id, "flagged")}
                    className="btn btn-flag"
                    disabled={moderating === thread.id}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 6,
                      border: "1px solid #f59e0b",
                      background: "transparent",
                      color: "#f59e0b",
                      cursor:
                        moderating === thread.id ? "not-allowed" : "pointer",
                      fontSize: "0.8rem",
                      opacity: moderating === thread.id ? 0.6 : 1,
                    }}
                  >
                    {moderating === thread.id ? "…" : "Flag"}
                  </button>
                )}
                {thread.status !== "rejected" && (
                  <button
                    onClick={() => handleModerate(thread.id, "rejected")}
                    className="btn btn-reject"
                    disabled={moderating === thread.id}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 6,
                      border: "none",
                      background: "#991b1b",
                      color: "#fff",
                      cursor:
                        moderating === thread.id ? "not-allowed" : "pointer",
                      fontSize: "0.8rem",
                      opacity: moderating === thread.id ? 0.6 : 1,
                    }}
                  >
                    {moderating === thread.id ? "…" : "Reject"}
                  </button>
                )}
                <button
                  onClick={() => setDeleteTarget(thread)}
                  className="btn btn-delete"
                  disabled={moderating === thread.id}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 6,
                    border: "1px solid #ef4444",
                    background: "transparent",
                    color: "#ef4444",
                    cursor:
                      moderating === thread.id ? "not-allowed" : "pointer",
                    fontSize: "0.8rem",
                    opacity: moderating === thread.id ? 0.6 : 1,
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Thread</h3>
            <p>
              Are you sure you want to delete "{deleteTarget.title}"? This
              action cannot be undone.
            </p>
            {deleteError && <p style={{ color: "#ef4444" }}>{deleteError}</p>}
            <div className="modal-actions">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  background: "#fff",
                  cursor: deleting ? "not-allowed" : "pointer",
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "none",
                  background: "#ef4444",
                  color: "#fff",
                  cursor: deleting ? "not-allowed" : "pointer",
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
