import React, { useState, useEffect, useRef } from "react";
import rrwebPlayer from "rrweb-player";
import "rrweb-player/dist/style.css";

export function SessionPlayer() {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const playerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/admin/analytics/recordings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch recordings");
      const list = await res.json();
      setRecordings(list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const playSession = async (sessionId) => {
    setActiveSessionId(sessionId);
    if (playerRef.current) {
      // Destroy old player
      if (containerRef.current) {
        containerRef.current.textContent = "";
      }
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/admin/analytics/recordings/${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch recording events");
      const events = await res.json();

      if (!events || events.length < 2) {
        alert("Not enough events to play");
        return;
      }

      playerRef.current = new rrwebPlayer({
        target: containerRef.current,
        props: {
          events,
          autoPlay: true,
          width: 800,
          height: 600,
        },
      });
    } catch (e) {
      console.error("Playback error", e);
      alert("Failed to load session events");
    }
  };

  return (
    <div style={{ display: "flex", gap: "2rem", marginTop: "2rem" }}>
      <div style={{ width: "300px", flexShrink: 0 }}>
        <h3 className="font-bold mb-4">Recent Sessions</h3>
        {loading && <p className="text-gray-500">Loading sessions...</p>}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            maxHeight: "600px",
            overflowY: "auto",
          }}
        >
          {recordings.map((rec) => (
            <div
              key={rec.id}
              onClick={() => playSession(rec.session_id)}
              style={{
                padding: "1rem",
                background:
                  activeSessionId === rec.session_id ? "#6366f1" : "#f3f4f6",
                color: activeSessionId === rec.session_id ? "#fff" : "#1f2937",
                borderRadius: "8px",
                cursor: "pointer",
                border: "1px solid #e5e7eb",
                transition: "background 0.2s",
              }}
            >
              <div style={{ fontSize: "0.9rem", fontWeight: "bold" }}>
                {rec.user_name || "Anonymous"}
              </div>
              <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                {new Date(rec.start_time).toLocaleString()}
              </div>
              <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                {rec.device} - {rec.browser}
              </div>
            </div>
          ))}
          {!loading && recordings.length === 0 && (
            <p className="text-gray-500 text-sm">
              No session recordings found.
            </p>
          )}
        </div>
      </div>

      <div style={{ flexGrow: 1 }}>
        <h3 className="font-bold mb-4">Playback Area</h3>
        <div
          ref={containerRef}
          style={{
            width: "800px",
            height: "600px",
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            position: "relative",
          }}
        >
          {!activeSessionId && (
            <div className="text-gray-400">
              [ Select a session from the list to start playback ]
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
