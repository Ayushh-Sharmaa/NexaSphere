import { useState, useEffect, useMemo } from "react";
import { api, eventEmitter, EVENTS } from "../services/api";
import { Skeleton } from "../components/Skeleton";

const STATUS_COLORS = {
  pending: { bg: "rgba(255,193,7,0.15)", color: "#f59e0b" },
  approved: { bg: "rgba(16,185,129,0.15)", color: "#10b981" },
  rejected: { bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
};

const CATEGORY_LABELS = {
  study_material: "Study Material",
  project_template: "Project Template",
  notes: "Notes",
  past_papers: "Past Papers",
  recorded_sessions: "Recorded Sessions",
  other: "Other",
};

export function ResourcesManager() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const loadResources = async () => {
    setLoading(true);
    try {
      const data = await api.resources.getAll();
      setResources(Array.isArray(data?.resources) ? data.resources : []);
    } catch (err) {
      console.error("Failed to load resources:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const filtered = useMemo(() => {
    let result = [...resources];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          (r.description || "").toLowerCase().includes(q) ||
          (r.uploadedBy || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter) {
      result = result.filter((r) => r.status === statusFilter);
    }
    return result;
  }, [resources, searchQuery, statusFilter]);

  const handleModerate = async (id, status) => {
    try {
      await api.resources.moderate(id, status);
      setResources((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
      eventEmitter.emit(EVENTS.NOTIFY, {
        type: "success",
        message: `Resource ${status}`,
      });
    } catch (err) {
      eventEmitter.emit(EVENTS.NOTIFY, {
        type: "error",
        message: err.message,
      });
    }
  };

  const handleDelete = async (id) => {
    setDeleteError(null);
    try {
      await api.resources.delete(id);
      setResources((prev) => prev.filter((r) => r.id !== id));
      setDeleteTarget(null);
      eventEmitter.emit(EVENTS.NOTIFY, {
        type: "success",
        message: "Resource deleted",
      });
    } catch (err) {
      setDeleteError(err.message);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Resource Library</h2>
        <p className="page-subtitle">
          Manage community-shared resources, study materials, and templates
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Search by title, description, or uploader..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input"
          style={{ flex: 1, minWidth: "200px", padding: "10px 14px" }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input"
          style={{ padding: "10px 14px" }}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="list-item">
              <div
                className="list-item-left"
                style={{ width: "100%", gap: "12px" }}
              >
                <Skeleton height={40} width={40} rounded />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Skeleton height={16} width="38%" />
                  <div style={{ marginTop: "8px" }}>
                    <Skeleton height={12} width="68%" />
                  </div>
                  <div style={{ marginTop: "8px" }}>
                    <Skeleton height={12} width="82%" />
                  </div>
                </div>
              </div>
              <div className="list-item-right" style={{ minWidth: "260px" }}>
                <Skeleton height={28} width={72} />
                <Skeleton height={28} width={80} />
                <Skeleton height={28} width={72} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div
          style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}
        >
          <p style={{ fontSize: "1.1rem" }}>No resources found</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="list">
          {filtered.map((resource) => {
            const sc = STATUS_COLORS[resource.status] || STATUS_COLORS.pending;
            return (
              <div key={resource.id} className="list-item">
                <div className="list-item-left">
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "8px",
                      background: sc.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.2rem",
                      flexShrink: 0,
                    }}
                  >
                    {resource.fileType?.includes("pdf")
                      ? "📕"
                      : resource.fileType?.includes("zip")
                        ? "📦"
                        : resource.fileType?.includes("video")
                          ? "🎬"
                          : "📄"}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="list-item-title" title={resource.title}>
                      {resource.title}
                    </div>
                    <div className="list-item-meta">
                      {CATEGORY_LABELS[resource.category] || resource.category}{" "}
                      · {resource.uploadedBy || "Anonymous"} · ⬇{" "}
                      {resource.downloads || 0} · 👍{" "}
                      {resource.votes?.length || 0}
                    </div>
                    {resource.description && (
                      <div
                        style={{
                          fontSize: "0.78rem",
                          color: "#999",
                          marginTop: "4px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "400px",
                        }}
                      >
                        {resource.description}
                      </div>
                    )}
                  </div>
                </div>
                <div className="list-item-right">
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: "12px",
                      fontSize: "0.72rem",
                      fontWeight: 500,
                      background: sc.bg,
                      color: sc.color,
                      textTransform: "capitalize",
                    }}
                  >
                    {resource.status}
                  </span>

                  {resource.status === "pending" && (
                    <>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleModerate(resource.id, "approved")}
                        title="Approve"
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleModerate(resource.id, "rejected")}
                        title="Reject"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => setDeleteTarget(resource)}
                    title="Delete resource"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteTarget && (
        <div
          className="modal-overlay"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setDeleteTarget(null);
              setDeleteError(null);
            }
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-resource-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-resource-title">Delete Resource</h3>
            <p>Are you sure you want to delete "{deleteTarget.title}"?</p>
            {deleteError && <p className="page-error">{deleteError}</p>}
            <div className="modal-actions">
              <button
                className="btn btn-outline"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(deleteTarget.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
