/**
 * Real-Time Activity Log Stream Component with WebSocket Support.
 * Streams live system events, supports severity level filtering (INFO/WARN/ERROR), and auto-reconnects (#4143).
 */

import React, { useState, useEffect, useRef, useMemo } from "react";

export default function ActivityLogStream({
  wsUrl = "wss://api.nexasphere.io/ws/activity",
  maxLogs = 100,
}) {
  const [logs, setLogs] = useState([]);
  const [filterSeverity, setFilterSeverity] = useState("ALL");
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  useEffect(() => {
    let isSubscribed = true;

    function connect() {
      try {
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          if (isSubscribed) setIsConnected(true);
        };

        socket.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const data = JSON.parse(event.data);
            setLogs((prevLogs) => [data, ...prevLogs].slice(0, maxLogs));
          } catch (e) {
            console.warn("Failed to parse log message:", e);
          }
        };

        socket.onclose = () => {
          if (isSubscribed) {
            setIsConnected(false);
            reconnectTimerRef.current = setTimeout(connect, 3000);
          }
        };

        socket.onerror = (err) => {
          console.warn("WebSocket error:", err);
          socket.close();
        };
      } catch (err) {
        if (isSubscribed) {
          setIsConnected(false);
          reconnectTimerRef.current = setTimeout(connect, 5000);
        }
      }
    }

    connect();

    return () => {
      isSubscribed = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [wsUrl, maxLogs]);

  const filteredLogs = useMemo(() => {
    if (filterSeverity === "ALL") return logs;
    return logs.filter((log) => log.severity === filterSeverity);
  }, [logs, filterSeverity]);

  return (
    <div className="activity-log-stream p-4 border border-zinc-800 rounded-xl bg-zinc-900/60 shadow-xl">
      <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
            }`}
          />
          <h3 className="font-semibold text-white text-base">Real-Time Activity Stream</h3>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-400">Filter:</label>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-zinc-800 text-xs text-zinc-200 border border-zinc-700 rounded px-2 py-1 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
          </select>
        </div>
      </div>

      <div className="log-container h-80 overflow-y-auto font-mono text-xs space-y-1.5 pr-2">
        {filteredLogs.length === 0 ? (
          <div className="text-zinc-500 text-center py-10">No activity logs captured yet.</div>
        ) : (
          filteredLogs.map((log, idx) => {
            let badgeColor = "text-zinc-400 bg-zinc-800";
            if (log.severity === "INFO") badgeColor = "text-blue-400 bg-blue-950/60 border border-blue-800/50";
            if (log.severity === "WARN") badgeColor = "text-amber-400 bg-amber-950/60 border border-amber-800/50";
            if (log.severity === "ERROR") badgeColor = "text-rose-400 bg-rose-950/60 border border-rose-800/50";

            return (
              <div key={log.id || idx} className="p-2 rounded bg-zinc-950/40 border border-zinc-800/40 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${badgeColor}`}>
                    {log.severity || "INFO"}
                  </span>
                  <span className="text-zinc-300">{log.message}</span>
                </div>
                <span className="text-[10px] text-zinc-500 whitespace-nowrap">{log.timestamp}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
