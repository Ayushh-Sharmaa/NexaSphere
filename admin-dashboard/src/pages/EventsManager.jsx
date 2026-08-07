import { useState, useCallback } from "react";
import { api } from "../services/api";
import { useEvents } from "../hooks/useEvents";
import { useEventListener } from "../hooks/useEventListener";
import { EVENTS } from "../services/eventEmitter";
import { EventForm } from "../components/EventForm";
import { Skeleton } from "../components/Skeleton";
import { AdminIcon } from "../components/AdminIcon";
import { HelpTooltip } from "../components/HelpTooltip";

const STATUS_COLORS = {
  upcoming: "#3b82f6",
  ongoing: "#22c55e",
  completed: "#6b7280",
  cancelled: "#ef4444",
};

export function EventsManager() {
  const { events, setEvents, loading, error, reload } = useEvents();
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  // After any change, reload from server to stay in sync
  useEventListener(
    EVENTS.EVENT_CREATED,
    useCallback(() => {
      reload();
      setShowForm(false);
    }, [reload])
  );

  useEventListener(
    EVENTS.EVENT_UPDATED,
    useCallback(() => {
      reload();
      setEditingEvent(null);
      setShowForm(false);
    }, [reload])
  );

  useEventListener(
    EVENTS.EVENT_DELETED,
    useCallback(() => {
      reload();
    }, [reload])
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleting(id);
    setDeleteError("");
    try {
      await api.events.delete(id);
      setDeleteTarget(null);
    } catch {
      setDeleteError("Failed to delete event. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const openEdit = (event) => {
    setEditingEvent(event);
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setEditingEvent(null);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <h2 className="page-title" style={{ margin: 0 }}>
            Events
          </h2>
          <HelpTooltip
            content="Schedule and manage upcoming events. Add locations, dates, descriptions, ticketing options, and monitor live status."
            position="right"
          />
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Add Event
        </button>
      </div>

      {(showForm || editingEvent) && (
        <EventForm event={editingEvent} onClose={closeForm} />
      )}

      {loading && <Skeleton height={72} count={4} />}
      {error && (
        <div className="page-error">Failed to load events: {error}</div>
      )}

      {!loading && !error && (
        <div className="list">
          {events.length === 0 && (
            <div className="empty-state">No events yet. Add one!</div>
          )}
          {events.map((event) => (
            <div key={event.id} className="list-item">
              <div className="list-item-left">
                <span className="item-icon">
                  <AdminIcon name={event.icon || "Calendar"} size={22} />
                </span>
                <div>
                  <div className="item-name">{event.name}</div>
                  <div className="item-meta">
                    {event.dateText}
                    {event.category && (
                      <span
                        style={{
                          marginLeft: 6,
                          padding: "1px 6px",
                          borderRadius: 8,
                          background: "var(--c2a)",
                          color: "var(--c2)",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                        }}
                      >
                        {event.category}
                      </span>
                    )}
                    {event.location && ` · ${event.location}`}
                  </div>
                </div>
              </div>
              <div className="list-item-right">
                <span
                  className="status-badge"
                  style={{
                    background: STATUS_COLORS[event.status] || "#6b7280",
                  }}
                >
                  {event.status}
                </span>
                <button
                  className="btn-icon"
                  onClick={() => openEdit(event)}
                  aria-label="Edit event"
                >
                  <AdminIcon name="Pencil" size={16} />
                </button>
                <button
                  className="btn-icon danger"
                  onClick={() => {
                    setDeleteTarget(event);
                    setDeleteError("");
                  }}
                  disabled={deleting === event.id}
                  aria-label="Delete event"
                >
                  {deleting === event.id ? (
                    "..."
                  ) : (
                    <AdminIcon name="Trash" size={16} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-event-title"
        >
          <div className="modal">
            <div className="modal-header">
              <h3 id="delete-event-title">Delete Event</h3>
              <button
                className="modal-close"
                onClick={() => setDeleteTarget(null)}
                aria-label="Close"
              >
                <AdminIcon name="X" size={16} />
              </button>
            </div>
            <p className="page-subtitle" style={{ marginBottom: 16 }}>
              This will remove "{deleteTarget.name}" from the admin events list.
            </p>
            {deleteError && <div className="page-error">{deleteError}</div>}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 20,
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
                {deleting === deleteTarget.id ? "Deleting..." : "Delete Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
