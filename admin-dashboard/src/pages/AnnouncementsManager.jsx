import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { useEventListener } from "../hooks/useEventListener";
import { EVENTS } from "../services/eventEmitter";
import { Skeleton } from "../components/Skeleton";
import { AdminIcon } from "../components/AdminIcon";

export function AnnouncementsManager() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete states
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const fetchAnnouncements = useCallback(() => {
    setLoading(true);
    api.announcements
      .getAll()
      .then((data) => {
        setAnnouncements(data?.announcements ?? []);
      })
      .catch(() => {
        setAnnouncements([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Sync state with events from emitter (e.g. if updated via background or another component)
  useEventListener(
    EVENTS.ANNOUNCEMENT_CREATED,
    useCallback((ann) => {
      setAnnouncements((prev) => [ann, ...prev]);
      closeForm();
    }, [])
  );

  useEventListener(
    EVENTS.ANNOUNCEMENT_UPDATED,
    useCallback((updatedAnn) => {
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === updatedAnn.id ? updatedAnn : a))
      );
      closeForm();
    }, [])
  );

  useEventListener(
    EVENTS.ANNOUNCEMENT_DELETED,
    useCallback(({ id }) => {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    }, [])
  );

  const openCreateForm = () => {
    setEditingAnnouncement(null);
    setTitle("");
    setContent("");
    setCategory("general");
    setPinned(false);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (ann) => {
    setEditingAnnouncement(ann);
    setTitle(ann.title || "");
    setContent(ann.content || "");
    setCategory(ann.category || "general");
    setPinned(ann.pinned || false);
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingAnnouncement(null);
    setTitle("");
    setContent("");
    setCategory("general");
    setPinned(false);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setFormError("Please fill out all required fields.");
      return;
    }

    setSaving(true);
    setFormError("");

    const announcementData = {
      title: title.trim(),
      content: content.trim(),
      category,
      pinned,
    };

    try {
      if (editingAnnouncement) {
        await api.announcements.update(
          editingAnnouncement.id,
          announcementData
        );
        // Force refresh if online mode handles it asynchronously
        fetchAnnouncements();
      } else {
        await api.announcements.create(announcementData);
        fetchAnnouncements();
      }
    } catch (err) {
      setFormError(
        err.message || "Failed to save announcement. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleting(id);
    setDeleteError("");
    try {
      await api.announcements.delete(id);
      setDeleteTarget(null);
      fetchAnnouncements();
    } catch (err) {
      setDeleteError("Failed to delete announcement. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  // Filtered & sorted announcements logic
  const filteredAnnouncements = announcements
    .filter((ann) => {
      const matchesSearch =
        ann.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ann.content?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || ann.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // Pinned ones always come first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      // Then sort by date (newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const getCategoryColor = (cat) => {
    switch (cat) {
      case "alert":
        return { bg: "rgba(239, 68, 68, 0.15)", color: "#EF4444" };
      case "event":
        return { bg: "rgba(59, 130, 246, 0.15)", color: "#3B82F6" };
      case "update":
        return { bg: "rgba(16, 185, 129, 0.15)", color: "#10B981" };
      default:
        return { bg: "rgba(245, 158, 11, 0.15)", color: "#F59E0B" };
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Announcements & Notifications</h2>
          <p className="page-subtitle">
            Publish club announcements, event updates, alerts, and system
            notices.
          </p>
        </div>
        <button className="btn-primary" onClick={openCreateForm}>
          + New Announcement
        </button>
      </div>

      {/* ── Search and Filter Controls ── */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: "1", minWidth: "240px" }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: "36px", margin: 0 }}
          />
          <div
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              opacity: 0.5,
            }}
          >
            <AdminIcon name="Calendar" size={16} />{" "}
            {/* Placeholder icon search helper */}
          </div>
        </div>

        <select
          className="input-field"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ width: "180px", margin: 0 }}
        >
          <option value="all">All Categories</option>
          <option value="general">General</option>
          <option value="event">Event Updates</option>
          <option value="alert">Critical Alerts</option>
          <option value="update">System Updates</option>
        </select>
      </div>

      {/* ── Form Modal ── */}
      {showForm && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="form-title"
        >
          <div className="modal" style={{ maxWidth: "600px", width: "100%" }}>
            <div className="modal-header">
              <h3 id="form-title">
                {editingAnnouncement ? "Edit Announcement" : "New Announcement"}
              </h3>
              <button
                className="modal-close"
                onClick={closeForm}
                aria-label="Close"
              >
                <AdminIcon name="X" size={16} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {formError && (
                <div
                  className="page-error"
                  style={{ padding: "10px", borderRadius: "4px" }}
                >
                  {formError}
                </div>
              )}

              <div>
                <label className="input-label" htmlFor="title">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  className="input-field"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Hackathon Registrations Extended!"
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "180px" }}>
                  <label className="input-label" htmlFor="category">
                    Category
                  </label>
                  <select
                    id="category"
                    className="input-field"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="general">General</option>
                    <option value="event">Event Updates</option>
                    <option value="alert">Critical Alert</option>
                    <option value="update">System Update</option>
                  </select>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "24px",
                  }}
                >
                  <input
                    type="checkbox"
                    id="pinned"
                    checked={pinned}
                    onChange={(e) => setPinned(e.target.checked)}
                    style={{ cursor: "pointer", width: "18px", height: "18px" }}
                  />
                  <label
                    htmlFor="pinned"
                    style={{ cursor: "pointer", userSelect: "none" }}
                  >
                    Pin to top of feed
                  </label>
                </div>
              </div>

              <div>
                <label className="input-label" htmlFor="content">
                  Content *
                </label>
                <textarea
                  id="content"
                  className="input-field"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe your announcement in detail..."
                  style={{ minHeight: "150px", resize: "vertical" }}
                  required
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "12px",
                }}
              >
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : editingAnnouncement
                      ? "Save Changes"
                      : "Publish Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Main List Content ── */}
      {loading && <Skeleton height={120} count={3} />}

      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredAnnouncements.length === 0 && (
            <div
              className="empty-state"
              style={{
                padding: "48px 0",
                border: "1px dashed rgba(255,255,255,0.06)",
              }}
            >
              No announcements match your search filters.
            </div>
          )}

          {filteredAnnouncements.map((ann) => {
            const colors = getCategoryColor(ann.category);
            return (
              <div
                key={ann.id}
                className="team-card"
                style={{
                  flexDirection: "column",
                  alignItems: "stretch",
                  padding: "20px",
                  position: "relative",
                  borderLeft: ann.pinned
                    ? "3px solid var(--admin-accent, #CC1111)"
                    : "3px solid transparent",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: "bold",
                        padding: "3px 8px",
                        borderRadius: "12px",
                        textTransform: "uppercase",
                        backgroundColor: colors.bg,
                        color: colors.color,
                      }}
                    >
                      {ann.category}
                    </span>

                    {ann.pinned && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: "bold",
                          padding: "3px 8px",
                          borderRadius: "12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          backgroundColor: "rgba(204, 17, 17, 0.15)",
                          color: "var(--admin-accent, #CC1111)",
                        }}
                      >
                        <AdminIcon name="Pin" size={10} />
                        PINNED
                      </span>
                    )}

                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--admin-text-muted, #888)",
                      }}
                    >
                      {new Date(ann.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      className="btn-icon"
                      onClick={() => openEditForm(ann)}
                      aria-label="Edit announcement"
                    >
                      <AdminIcon name="Pencil" size={14} />
                    </button>
                    <button
                      className="btn-icon danger"
                      onClick={() => setDeleteTarget(ann)}
                      aria-label="Delete announcement"
                    >
                      <AdminIcon name="Trash" size={14} />
                    </button>
                  </div>
                </div>

                <h3
                  style={{
                    fontSize: "1.2rem",
                    marginTop: "12px",
                    marginBottom: "8px",
                    color: "#fff",
                  }}
                >
                  {ann.title}
                </h3>

                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--admin-text-muted, #bbb)",
                    lineHeight: "1.5",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {ann.content}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
        >
          <div className="modal">
            <div className="modal-header">
              <h3 id="delete-title">Delete Announcement</h3>
              <button
                className="modal-close"
                onClick={() => setDeleteTarget(null)}
                aria-label="Close"
              >
                <AdminIcon name="X" size={16} />
              </button>
            </div>

            <p className="page-subtitle" style={{ marginBottom: 16 }}>
              Are you sure you want to permanently delete "{deleteTarget.title}
              "? This action is irreversible.
            </p>

            {deleteError && <div className="page-error">{deleteError}</div>}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button
                className="btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting === deleteTarget.id}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleDelete}
                disabled={deleting === deleteTarget.id}
              >
                {deleting === deleteTarget.id
                  ? "Deleting..."
                  : "Delete Announcement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
