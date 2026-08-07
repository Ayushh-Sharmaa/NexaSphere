import { useState, useRef, useCallback } from "react";
import { api } from "../services/api";
import { AdminIcon } from "../components/AdminIcon";
import { Skeleton } from "../components/Skeleton";

export function EventScanner() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [manualEmail, setManualEmail] = useState("");
  const [attendanceLog, setAttendanceLog] = useState([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!eventsLoaded) {
    api.events
      .getAll()
      .then((data) => {
        if (data?.events) setEvents(data.events);
        setEventsLoaded(true);
      })
      .catch(() => setEventsLoaded(true));
  }

  const markAttendance = useCallback(
    async (payload) => {
      if (!selectedEventId) return;
      setScanning(true);
      setScanResult(null);
      try {
        const result = await api.eventRegistrations.markAttendance(
          selectedEventId,
          {
            ...payload,
            eventId: selectedEventId,
          }
        );
        setScanResult(result);
        if (!result.already_attended) {
          setAttendanceLog((prev) => [result, ...prev]);
        }
      } catch (e) {
        setScanResult({ error: e.message });
      } finally {
        setScanning(false);
      }
    },
    [selectedEventId]
  );

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualEmail.trim()) return;
    markAttendance({ email: manualEmail.trim().toLowerCase() });
    setManualEmail("");
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Event Scanner</h2>
      </div>

      <div style={{ marginBottom: 20 }}>
        <select
          value={selectedEventId}
          onChange={(e) => {
            setSelectedEventId(e.target.value);
            setScanResult(null);
          }}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid var(--admin-border, #333)",
            background: "var(--admin-bg-card, #1a1a2e)",
            color: "var(--admin-text, #eee)",
            width: 300,
          }}
        >
          <option value="">Select an event…</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name}
            </option>
          ))}
        </select>
      </div>

      {!selectedEventId && (
        <div className="empty-state">
          Select an event to start scanning QR codes or entering emails.
        </div>
      )}

      {selectedEventId && (
        <>
          <div
            style={{
              background: "var(--admin-bg-card, #1a1a2e)",
              border: "1px solid var(--admin-border, #333)",
              borderRadius: 12,
              padding: 24,
              marginBottom: 20,
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: 16,
                fontFamily: "Rajdhani,sans-serif",
              }}
            >
              <AdminIcon name="Search" size={16} style={{ marginRight: 8 }} />
              Manual Entry
            </h3>
            <form
              onSubmit={handleManualSubmit}
              style={{ display: "flex", gap: 10 }}
            >
              <input
                type="email"
                placeholder="Enter attendee email…"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                required
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--admin-border, #333)",
                  background: "var(--admin-bg, #111)",
                  color: "var(--admin-text, #eee)",
                }}
              />
              <button type="submit" disabled={scanning} className="btn-primary">
                {scanning ? "Marking…" : "Mark Present"}
              </button>
            </form>
          </div>

          {scanResult && (
            <div
              style={{
                background: scanResult.error
                  ? "rgba(239,68,68,0.1)"
                  : "rgba(34,197,94,0.1)",
                border: `1px solid ${scanResult.error ? "#ef4444" : "#22c55e"}40`,
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <AdminIcon
                name={scanResult.error ? "XCircle" : "CheckCircle"}
                size={24}
                style={{
                  color: scanResult.error ? "#ef4444" : "#22c55e",
                  flexShrink: 0,
                }}
              />
              <div>
                {scanResult.error ? (
                  <div style={{ color: "#ef4444", fontWeight: 600 }}>
                    {scanResult.error}
                  </div>
                ) : (
                  <>
                    <div style={{ fontWeight: 600, color: "#22c55e" }}>
                      {scanResult.already_attended
                        ? "Already marked present"
                        : "Attendance marked!"}
                    </div>
                    <div
                      style={{
                        color: "var(--admin-text-muted, #888)",
                        fontSize: "0.85rem",
                      }}
                    >
                      {scanResult.full_name} — {scanResult.email}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {attendanceLog.length > 0 && (
            <div>
              <h3
                style={{ marginBottom: 12, fontFamily: "Rajdhani,sans-serif" }}
              >
                <AdminIcon name="Clock" size={16} style={{ marginRight: 8 }} />
                Recent Attendance
              </h3>
              <div className="list">
                {attendanceLog.map((entry, i) => (
                  <div key={i} className="list-item">
                    <div className="list-item-left">
                      <div>
                        <div className="item-name">{entry.full_name}</div>
                        <div className="item-meta">{entry.email}</div>
                      </div>
                    </div>
                    <div className="list-item-right">
                      <span
                        className="status-badge"
                        style={{ background: "#22c55e" }}
                      >
                        Present
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
