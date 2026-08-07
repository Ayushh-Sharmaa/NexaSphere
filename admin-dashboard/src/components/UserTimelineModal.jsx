import React, { useState, useEffect } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";

export default function UserTimelineModal({ user, onClose }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usernameInput, setUsernameInput] = useState(user.username || "");

  const modalRef = useFocusTrap(true, onClose);

  const fetchTimeline = async (email, username) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (email) params.append("email", email);
      if (username) params.append("username", username);

      const res = await fetch(
        `/api/admin/users/timeline?${params.toString()}`,
        {
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Failed to fetch timeline");
      const data = await res.json();
      setTimeline(data.timeline || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.email) {
      fetchTimeline(user.email, usernameInput);
    }
  }, [user.email]);

  const handleRefresh = () => {
    fetchTimeline(user.email, usernameInput);
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (user.email) params.append("email", user.email);
    if (usernameInput) params.append("username", usernameInput);
    window.open(
      `/api/admin/users/timeline/export?${params.toString()}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="User Timeline"
        style={{
          backgroundColor: "var(--admin-bg-card, #1a1a2e)",
          padding: 24,
          borderRadius: 8,
          width: "80%",
          maxWidth: 800,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2 style={{ margin: 0 }}>
            Activity Timeline: {user.display_name || user.email}
          </h2>
          <button onClick={onClose} style={{ cursor: "pointer" }}>
            Close
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 20,
            alignItems: "center",
          }}
        >
          <label htmlFor="portfolio-username-input">Portfolio Username:</label>
          <input
            id="portfolio-username-input"
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            placeholder="Link portfolio events..."
            style={{ padding: 6, borderRadius: 4, flex: 1 }}
          />
          <button onClick={handleRefresh} disabled={loading}>
            Refresh
          </button>
          <button onClick={handleExport}>Export CSV</button>
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        {loading ? (
          <p>Loading timeline...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            {timeline.length === 0 ? (
              <p>No activity found.</p>
            ) : (
              timeline.map((event) => (
                <div
                  key={event.id}
                  style={{
                    padding: 15,
                    borderRadius: 6,
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderLeft: "4px solid #4a90e2",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#aaa",
                      marginBottom: 4,
                    }}
                  >
                    {new Date(event.timestamp).toLocaleString()} •{" "}
                    {event.type.replace(/_/g, " ").toUpperCase()}
                  </div>
                  <strong
                    style={{
                      display: "block",
                      fontSize: "1.1rem",
                      marginBottom: 4,
                    }}
                  >
                    {event.title}
                  </strong>
                  <p style={{ margin: 0, color: "#ccc", fontSize: "0.9rem" }}>
                    {event.description}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
