import { useState, useCallback } from "react";
import { api, eventEmitter, EVENTS } from "../services/api";

export function WaitingRoomManager() {
  const [eventId, setEventId] = useState("");
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadQueue = async () => {
    if (!eventId.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.waitingRoom.getQueue(eventId.trim());
      setQueue(data?.queue ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdmitOne = async () => {
    if (!queue.length) return;
    try {
      await api.waitingRoom.admitOne(eventId.trim());
      eventEmitter.emit(EVENTS.NOTIFY, {
        type: "success",
        message: "Attendee admitted",
      });
      loadQueue();
    } catch (err) {
      eventEmitter.emit(EVENTS.NOTIFY, { type: "error", message: err.message });
    }
  };

  const handleAdmitAll = async () => {
    if (!queue.length) return;
    try {
      await api.waitingRoom.admitAll(eventId.trim());
      eventEmitter.emit(EVENTS.NOTIFY, {
        type: "success",
        message: `All ${queue.length} attendees admitted`,
      });
      loadQueue();
    } catch (err) {
      eventEmitter.emit(EVENTS.NOTIFY, { type: "error", message: err.message });
    }
  };

  const handleRemove = async (entryId) => {
    try {
      await api.waitingRoom.remove(eventId.trim(), entryId);
      eventEmitter.emit(EVENTS.NOTIFY, {
        type: "success",
        message: "Attendee removed",
      });
      loadQueue();
    } catch (err) {
      eventEmitter.emit(EVENTS.NOTIFY, { type: "error", message: err.message });
    }
  };

  const handleMoveFront = async (entryId) => {
    try {
      await api.waitingRoom.moveToFront(eventId.trim(), entryId);
      eventEmitter.emit(EVENTS.NOTIFY, {
        type: "success",
        message: "Moved to front of queue",
      });
      loadQueue();
    } catch (err) {
      eventEmitter.emit(EVENTS.NOTIFY, { type: "error", message: err.message });
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    try {
      await api.waitingRoom.sendMessage(eventId.trim(), message.trim());
      eventEmitter.emit(EVENTS.NOTIFY, {
        type: "success",
        message: "Message sent to waiting room",
      });
      setMessage("");
    } catch (err) {
      eventEmitter.emit(EVENTS.NOTIFY, { type: "error", message: err.message });
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Waiting Room & Queue Management</h2>
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
          alignItems: "flex-end",
        }}
      >
        <div className="form-row" style={{ flex: 1, marginBottom: 0 }}>
          <label>Event ID</label>
          <input
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            placeholder="Enter event ID (e.g. kss-153)"
            onKeyDown={(e) => e.key === "Enter" && loadQueue()}
          />
        </div>
        <button className="btn-primary" onClick={loadQueue} disabled={loading}>
          {loading ? "Loading..." : "Load Queue"}
        </button>
      </div>

      {error && <div className="page-error">{error}</div>}

      {queue.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "16px",
            flexWrap: "wrap",
          }}
        >
          <button className="btn btn-sm btn-success" onClick={handleAdmitOne}>
            Admit Next ({queue[0]?.fullName || "N/A"})
          </button>
          <button className="btn btn-sm btn-primary" onClick={handleAdmitAll}>
            Admit All ({queue.length})
          </button>
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              marginLeft: "auto",
            }}
          >
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message to waiting room..."
              className="input"
              style={{
                padding: "6px 10px",
                fontSize: "0.8rem",
                minWidth: "200px",
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <button
              className="btn btn-sm btn-outline"
              onClick={handleSendMessage}
              disabled={!message.trim()}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {!loading && queue.length === 0 && eventId && (
        <div
          style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}
        >
          <p>No attendees in the waiting room queue.</p>
        </div>
      )}

      {queue.length > 0 && (
        <div className="list">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 16px",
              fontSize: "0.78rem",
              color: "#888",
              borderBottom: "1px solid var(--bdr)",
            }}
          >
            <span>
              {queue.length} attendee{queue.length !== 1 ? "s" : ""} waiting
            </span>
          </div>
          {queue.map((entry, idx) => (
            <div
              key={entry.id}
              className="list-item"
              style={{
                background: entry.isPriority
                  ? "rgba(251,191,36,0.05)"
                  : undefined,
              }}
            >
              <div className="list-item-left">
                <span
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: entry.isPriority
                      ? "rgba(251,191,36,0.15)"
                      : "var(--c1a)",
                    color: entry.isPriority ? "#fbbf24" : "var(--c1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {idx + 1}
                </span>
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span className="list-item-title">{entry.fullName}</span>
                    {entry.isPriority && (
                      <span
                        style={{
                          padding: "1px 6px",
                          borderRadius: "4px",
                          background: "rgba(251,191,36,0.15)",
                          color: "#fbbf24",
                          fontSize: "0.65rem",
                          fontWeight: 600,
                        }}
                      >
                        VIP
                      </span>
                    )}
                  </div>
                  <div className="list-item-meta">
                    {entry.email}
                    {entry.joinedAt &&
                      ` · ${new Date(entry.joinedAt).toLocaleTimeString()}`}
                  </div>
                </div>
              </div>
              <div className="list-item-right">
                {idx > 0 && (
                  <button
                    className="btn-icon"
                    onClick={() => handleMoveFront(entry.id)}
                    title="Move to front"
                    aria-label="Move to front"
                  >
                    ⬆
                  </button>
                )}
                <button
                  className="btn-icon danger"
                  onClick={() => handleRemove(entry.id)}
                  title="Remove from queue"
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
