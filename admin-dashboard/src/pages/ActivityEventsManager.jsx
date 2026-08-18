import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";
import { Skeleton } from "../components/Skeleton";
import { AdminIcon } from "../components/AdminIcon";

const ACTIVITIES = [
  { key: "hackathon", name: "Hackathon", desc: "24-48h collaborative sprints" },
  {
    key: "codathon",
    name: "Codathon",
    desc: "Competitive programming & algorithms",
  },
  {
    key: "ideathon",
    name: "Ideathon",
    desc: "Product pitches & solution brainstorming",
  },
  {
    key: "promptathon",
    name: "Promptathon",
    desc: "AI prompting & LLM engineering",
  },
  { key: "workshop", name: "Workshop", desc: "Hands-on tech masterclasses" },
  {
    key: "insight_session",
    name: "Insight Session",
    desc: "Industry talks & panel discussions",
  },
  {
    key: "open_source_day",
    name: "Open Source Day",
    desc: "PR drives & Git contributions",
  },
  {
    key: "tech_debate",
    name: "Tech Debate",
    desc: "Structured technology & AI debates",
  },
];

export function ActivityEventsManager() {
  const [selected, setSelected] = useState(ACTIVITIES[0].key);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [error, setError] = useState("");

  const [formFields, setFormFields] = useState({
    title: "",
    tagline: "",
    description: "",
    dateText: "",
    location: "GL Bajaj Campus / Virtual",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  const loadEvents = useCallback(async (key) => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get(`/api/v1/activities`, {
        params: { type: key, limit: 50 },
      });
      setEvents(res.data?.data?.activities ?? []);
    } catch (e) {
      setEvents([]);
      setError(
        e.response?.data?.error?.message ||
          e.message ||
          "Failed to load activity events."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents(selected);
  }, [selected, loadEvents]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formFields.title.trim() || !formFields.description.trim()) {
      alert("Title and description are required.");
      return;
    }
    setFormSubmitting(true);
    try {
      await axiosInstance.post("/api/v1/admin/activities", {
        activityType: selected,
        title: formFields.title,
        tagline: formFields.tagline,
        description: formFields.description,
        dateText: formFields.dateText,
        location: formFields.location,
      });
      setShowForm(false);
      setFormFields({
        title: "",
        tagline: "",
        description: "",
        dateText: "",
        location: "GL Bajaj Campus / Virtual",
      });
      loadEvents(selected);
    } catch (err) {
      alert(
        err.response?.data?.error?.message ||
          err.message ||
          "Failed to create activity."
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const eventId = deleteTarget.id;
    setDeleting(eventId);
    setDeleteError("");
    try {
      await axiosInstance.patch(`/api/v1/admin/activities/${eventId}/status`, {
        status: "archived",
      });
      setDeleteTarget(null);
      loadEvents(selected);
    } catch {
      setDeleteError("Failed to archive activity event. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const selectedActivity = ACTIVITIES.find((a) => a.key === selected);

  return (
    <div
      className="page"
      style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}
    >
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h2
            className="page-title"
            style={{ fontSize: "1.6rem", fontWeight: 800, margin: "0 0 4px 0" }}
          >
            Activity Programs (8 Categories)
          </h2>
          <p
            style={{
              color: "var(--text-secondary, #a0aec0)",
              margin: 0,
              fontSize: "0.9rem",
            }}
          >
            Select any of the 8 canonical activity tracks to manage scheduled
            sessions, workshops, and buildathons.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowForm(true)}
          style={{
            background: "#CC1111",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 18px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + Add New {selectedActivity?.name}
        </button>
      </div>

      <div
        className="tabs"
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          paddingBottom: "12px",
          marginBottom: "24px",
          overflowX: "auto",
        }}
      >
        {ACTIVITIES.map((a) => (
          <button
            key={a.key}
            className={`tab${selected === a.key ? " active" : ""}`}
            onClick={() => setSelected(a.key)}
            style={{
              background:
                selected === a.key ? "#CC1111" : "rgba(255,255,255,0.05)",
              color:
                selected === a.key ? "#fff" : "var(--text-secondary, #a0aec0)",
              border: "none",
              borderRadius: "6px",
              padding: "8px 14px",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {a.name}
          </button>
        ))}
      </div>

      {showForm && (
        <div
          style={{
            background: "rgba(25,25,25,0.9)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <h3
            style={{
              margin: "0 0 16px 0",
              fontSize: "1.15rem",
              fontWeight: 700,
            }}
          >
            Create New {selectedActivity?.name} Session
          </h3>
          <form onSubmit={handleCreate}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
                  Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder={`e.g. ${selectedActivity?.name} 2026`}
                  value={formFields.title}
                  onChange={(e) =>
                    setFormFields({ ...formFields, title: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(0,0,0,0.3)",
                    color: "#fff",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
                  Tagline / Subtitle
                </label>
                <input
                  type="text"
                  placeholder="Short exciting tagline"
                  value={formFields.tagline}
                  onChange={(e) =>
                    setFormFields({ ...formFields, tagline: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(0,0,0,0.3)",
                    color: "#fff",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
                  Date / Schedule Text
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sep 15-16, 2026"
                  value={formFields.dateText}
                  onChange={(e) =>
                    setFormFields({ ...formFields, dateText: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(0,0,0,0.3)",
                    color: "#fff",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. CS Lab 2 / Auditorium"
                  value={formFields.location}
                  onChange={(e) =>
                    setFormFields({ ...formFields, location: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(0,0,0,0.3)",
                    color: "#fff",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  marginBottom: "6px",
                }}
              >
                Description *
              </label>
              <textarea
                required
                rows="3"
                placeholder="Comprehensive description of the activity..."
                value={formFields.description}
                onChange={(e) =>
                  setFormFields({ ...formFields, description: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#fff",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 16px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formSubmitting}
                style={{
                  background: "#CC1111",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 16px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {formSubmitting ? "Saving..." : "Create Activity"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <Skeleton height={64} count={3} />}

      {error && (
        <div
          className="page-error"
          style={{
            color: "#FEB2B2",
            padding: "12px",
            background: "rgba(229,62,62,0.15)",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && (
        <div
          className="list"
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          {events.length === 0 && (
            <div
              className="empty-state"
              style={{
                textAlign: "center",
                padding: "32px",
                color: "var(--text-secondary, #a0aec0)",
              }}
            >
              No activities found under {selectedActivity?.name} yet. Click "+
              Add New" above to publish one!
            </div>
          )}
          {events.map((event) => (
            <div
              key={event.id}
              className="list-item"
              style={{
                background: "rgba(25,25,25,0.7)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px",
                padding: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "1rem",
                    marginBottom: "4px",
                  }}
                >
                  {event.title}
                </div>
                <div
                  style={{
                    color: "var(--text-secondary, #a0aec0)",
                    fontSize: "0.85rem",
                  }}
                >
                  {event.tagline && `${event.tagline} • `}
                  📍 {event.location || "GL Bajaj Campus"}
                  {event.date_text && ` • 📅 ${event.date_text}`}
                </div>
              </div>
              <button
                onClick={() => setDeleteTarget(event)}
                style={{
                  background: "rgba(229,62,62,0.15)",
                  border: "1px solid #E53E3E",
                  color: "#FEB2B2",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                Archive
              </button>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#1c1c1c",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "420px",
              width: "100%",
            }}
          >
            <h3 style={{ margin: "0 0 12px 0", fontSize: "1.15rem" }}>
              Archive Activity
            </h3>
            <p
              style={{
                color: "#a0aec0",
                fontSize: "0.88rem",
                marginBottom: "20px",
              }}
            >
              Are you sure you want to archive "{deleteTarget.title}" from{" "}
              {selectedActivity?.name}?
            </p>
            {deleteError && (
              <div
                style={{
                  color: "#FEB2B2",
                  marginBottom: "12px",
                  fontSize: "0.82rem",
                }}
              >
                {deleteError}
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                onClick={() => setDeleteTarget(null)}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 16px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  background: "#E53E3E",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 16px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {deleting ? "Archiving..." : "Confirm Archive"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
