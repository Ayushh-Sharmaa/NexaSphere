import { useState, useEffect, useCallback } from "react";
import { AdminIcon } from "../components/AdminIcon";
import { Skeleton } from "../components/Skeleton";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

const statusColors = {
  scheduled: "status-badge-info",
  live: "status-badge-success",
  ended: "status-badge-muted",
  archived: "status-badge-warning",
};

async function fetchWithAuth(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (res.status === 401) throw new Error("Session expired");
  if (!res.ok) {
    const text = await res.text();
    let err = {};
    try {
      err = JSON.parse(text);
    } catch {
      err = { error: text };
    }
    throw new Error(
      err.error || err.message || `Request failed (${res.status})`
    );
  }
  return res.json();
}

export function StreamManager() {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    event_id: "",
    title: "",
    description: "",
    stream_url: "",
    hls_url: "",
    scheduled_start: "",
    max_viewers: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (statusFilter) params.set("status", statusFilter);
      const data = await fetchWithAuth(`/api/admin/streams?${params}`);
      setStreams(data?.streams ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatus = async (id, status) => {
    try {
      await fetchWithAuth(`/api/streams/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setStreams((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s))
      );
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this stream?")) return;
    try {
      await fetchWithAuth(`/api/streams/${id}`, { method: "DELETE" });
      setStreams((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  const handleCreate = async () => {
    if (!form.event_id || !form.title) return;
    setSubmitting(true);
    try {
      await fetchWithAuth("/api/streams", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          max_viewers: parseInt(form.max_viewers, 10) || null,
        }),
      });
      setShowForm(false);
      setForm({
        event_id: "",
        title: "",
        description: "",
        stream_url: "",
        hls_url: "",
        scheduled_start: "",
        max_viewers: "",
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <h2 className="page-title">Stream Manager</h2>
        </div>
        <Skeleton lines={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="page-header">
          <h2 className="page-title">Stream Manager</h2>
        </div>
        <div className="page-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Stream Manager</h2>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "New Stream"}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 bg-gray-800 border border-gray-700 rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Event ID *"
              value={form.event_id}
              onChange={(e) =>
                setForm((p) => ({ ...p, event_id: e.target.value }))
              }
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm"
            />
            <input
              placeholder="Title *"
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm"
            />
            <input
              placeholder="Stream URL (RTMP)"
              value={form.stream_url}
              onChange={(e) =>
                setForm((p) => ({ ...p, stream_url: e.target.value }))
              }
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm"
            />
            <input
              placeholder="HLS URL (.m3u8)"
              value={form.hls_url}
              onChange={(e) =>
                setForm((p) => ({ ...p, hls_url: e.target.value }))
              }
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm"
            />
            <input
              placeholder="Scheduled start (ISO)"
              type="datetime-local"
              value={form.scheduled_start}
              onChange={(e) =>
                setForm((p) => ({ ...p, scheduled_start: e.target.value }))
              }
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm"
            />
            <input
              placeholder="Max viewers"
              type="number"
              value={form.max_viewers}
              onChange={(e) =>
                setForm((p) => ({ ...p, max_viewers: e.target.value }))
              }
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm"
            />
          </div>
          <textarea
            placeholder="Description"
            rows={2}
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm"
          />
          <button
            onClick={handleCreate}
            disabled={submitting || !form.event_id || !form.title}
            className="px-4 py-2 bg-purple-600 rounded text-sm hover:bg-purple-700 disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Stream"}
          </button>
        </div>
      )}

      <div
        className="tabs"
        style={{ display: "flex", gap: "8px", marginBottom: "16px" }}
      >
        {["", "scheduled", "live", "ended", "archived"].map((s) => (
          <button
            key={s}
            className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setStatusFilter(s)}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {streams.length === 0 ? (
        <div className="empty-state">No streams found.</div>
      ) : (
        <div className="list">
          {streams.map((s) => (
            <div key={s.id} className="list-item">
              <div className="list-item-left">
                <div className="item-name">{s.title}</div>
                <div className="item-meta">
                  Event: {s.eventId} · {s.viewerCount || 0} viewers
                  {s.scheduledStart && (
                    <> · {new Date(s.scheduledStart).toLocaleString()}</>
                  )}
                  {s.hlsUrl && (
                    <>
                      {" "}
                      ·{" "}
                      <a
                        href={s.hlsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--admin-accent)" }}
                      >
                        HLS
                      </a>
                    </>
                  )}
                </div>
              </div>
              <div className="list-item-right">
                <span
                  className={`status-badge ${statusColors[s.status] || ""}`}
                >
                  {s.status}
                </span>
                {s.status === "scheduled" && (
                  <button
                    className="btn-icon"
                    title="Go Live"
                    onClick={() => handleStatus(s.id, "live")}
                  >
                    <AdminIcon name="Play" size={16} />
                  </button>
                )}
                {s.status === "live" && (
                  <button
                    className="btn-icon danger"
                    title="End Stream"
                    onClick={() => handleStatus(s.id, "ended")}
                  >
                    <AdminIcon name="Square" size={16} />
                  </button>
                )}
                {s.status === "ended" && (
                  <button
                    className="btn-icon"
                    title="Archive"
                    onClick={() => handleStatus(s.id, "archived")}
                  >
                    <AdminIcon name="Archive" size={16} />
                  </button>
                )}
                <button
                  className="btn-icon danger"
                  title="Delete"
                  onClick={() => handleDelete(s.id)}
                >
                  <AdminIcon name="Trash2" size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
