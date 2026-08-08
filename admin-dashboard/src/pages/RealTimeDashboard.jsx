import { useEffect, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { initAdminSocket, getSocket, on, off } from "../services/socketClient";

const StatCard = ({ title, value, color, icon }) => (
  <div
    style={{
      background: "rgba(255,255,255,0.05)",
      border: `1px solid ${color}44`,
      borderRadius: "12px",
      padding: "24px",
      flex: 1,
      minWidth: "180px",
      boxShadow: `0 0 20px ${color}22`,
    }}
  >
    <div style={{ fontSize: "2rem", marginBottom: "4px" }}>{icon}</div>
    <div style={{ color: "#aaa", fontSize: "13px", marginBottom: "8px" }}>
      {title}
    </div>
    <div
      style={{
        color,
        fontSize: "2.5rem",
        fontWeight: "bold",
        letterSpacing: "-1px",
      }}
    >
      {value.toLocaleString()}
    </div>
    <div
      style={{
        marginTop: "8px",
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 8px ${color}`,
        animation: "pulse 1.5s infinite",
        display: "inline-block",
      }}
    />
    <span style={{ color, fontSize: "11px", marginLeft: "6px" }}>LIVE</span>
  </div>
);

export default function RealTimeDashboard() {
  const [stats, setStats] = useState({
    registrations: 0,
    attendees: 0,
    checkIns: 0,
  });
  const [trendData, setTrendData] = useState([]);
  const [eventData, setEventData] = useState({});
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    // Initialize shared admin socket
    initAdminSocket();
    const socket = getSocket();

    if (!socket) return;

    const handleConnect = () => {
      setConnected(true);
      setConnectionError("");
      setReconnecting(false);
      socket.emit("analytics:subscribe", "all");
      socket.emit("analytics:request:metrics", "all");
      socket.emit("analytics:request:trends", {
        eventId: "all",
        timeWindow: "7 days",
      });
    };

    const handleDisconnect = () => {
      setConnected(false);
      setReconnecting(true);
    };

    const handleConnectError = (err) => {
      setConnected(false);
      setReconnecting(true);
      setConnectionError(err?.message || "Connection failed");
    };

    const handleReconnectAttempt = () => {
      setReconnecting(true);
      setConnectionError("Reconnecting...");
    };

    const handleMetricsCurrent = (data) => {
      if (data?.metrics) {
        setStats({
          registrations: data.metrics.totalRegistrations || 0,
          attendees: data.metrics.totalAttendees || 0,
          checkIns: data.metrics.totalCheckIns || 0,
        });
        if (data.metrics.eventData) setEventData(data.metrics.eventData);
      }
    };

    const handleTrendsCurrent = (data) => {
      if (data?.trends) setTrendData(data.trends);
    };

    const handleMetricsUpdate = (data) => {
      if (data?.metrics) {
        setStats({
          registrations: data.metrics.totalRegistrations || 0,
          attendees: data.metrics.totalAttendees || 0,
          checkIns: data.metrics.totalCheckIns || 0,
        });
      }
    };

    if (socket.connected) {
      handleConnect();
    }

    on("connect", handleConnect);
    on("disconnect", handleDisconnect);
    on("connect_error", handleConnectError);
    on("reconnect_attempt", handleReconnectAttempt);
    on("analytics:metrics:current", handleMetricsCurrent);
    on("analytics:trends:current", handleTrendsCurrent);
    on("analytics:metrics:update", handleMetricsUpdate);

    return () => {
      off("connect", handleConnect);
      off("disconnect", handleDisconnect);
      off("connect_error", handleConnectError);
      off("reconnect_attempt", handleReconnectAttempt);
      off("analytics:metrics:current", handleMetricsCurrent);
      off("analytics:trends:current", handleTrendsCurrent);
      off("analytics:metrics:update", handleMetricsUpdate);
    };
  }, []);

  const retryConnection = useCallback(() => {
    setReconnecting(true);
    setConnectionError("Reconnecting...");
    const socket = getSocket();
    if (socket && !socket.connected) {
      socket.connect();
    }
  }, []);

  const exportCSV = useCallback(() => {
    const escapeCSV = (val) => {
      if (typeof val === "string") {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const rows = [
      ["Event", "Registrations", "Attendees", "Check-ins"],
      ...Object.entries(eventData).map(([name, d]) => [
        name,
        d.registrations,
        d.attendees,
        d.checkIns,
      ]),
      ["LIVE TOTAL", stats.registrations, stats.attendees, stats.checkIns],
    ];
    const csv = rows.map((r) => r.map(escapeCSV).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analytics.csv";
    a.click();
  }, [eventData, stats]);

  const eventChartData = Object.entries(eventData).map(([name, d]) => ({
    name: name.split(" ")[0],
    registrations: d.registrations,
    attendees: d.attendees,
    checkIns: d.checkIns,
  }));

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        color: "#fff",
        padding: "32px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: 700,
              color: "#fff",
            }}
          >
            📊 Real-Time Analytics
          </h1>
          <p style={{ margin: "4px 0 0", color: "#666", fontSize: "14px" }}>
            NexaSphere Event Dashboard
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "13px",
              background: connected ? "#00ff8822" : "#ff000022",
              color: connected ? "#00ff88" : "#ff4444",
              border: `1px solid ${connected ? "#00ff88" : "#ff4444"}44`,
            }}
          >
            {connected ? "🟢 Connected" : "🔴 Disconnected"}
          </div>
          {reconnecting && !connected && (
            <button
              onClick={retryConnection}
              style={{
                padding: "8px 14px",
                background: "#1d3557",
                color: "#fff",
                border: "1px solid #457b9d",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              Retry Connection
            </button>
          )}
          <button
            onClick={exportCSV}
            style={{
              padding: "8px 20px",
              background: "#e63946",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {/* Live Stat Cards */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "32px",
          flexWrap: "wrap",
        }}
      >
        <StatCard
          title="Total Registrations"
          value={stats.registrations}
          color="#e63946"
          icon="📝"
        />
        <StatCard
          title="Live Attendees"
          value={stats.attendees}
          color="#00b4d8"
          icon="👥"
        />
        <StatCard
          title="Check-ins Today"
          value={stats.checkIns}
          color="#00ff88"
          icon="✅"
        />
      </div>

      {/* Trend Chart */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          border: "1px solid #ffffff11",
        }}
      >
        <h2 style={{ margin: "0 0 20px", fontSize: "16px", color: "#ccc" }}>
          📈 Live Registration Trend
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="time" stroke="var(--chart-text)" fontSize={11} />
            <YAxis stroke="var(--chart-text)" fontSize={11} />
            <Tooltip
              contentStyle={{
                background: "#1a1a2e",
                border: "1px solid #333",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="registrations"
              stroke="var(--chart-danger)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="checkIns"
              stroke="var(--chart-success)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Event Bar Chart */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          borderRadius: "12px",
          padding: "24px",
          border: "1px solid #ffffff11",
        }}
      >
        <h2 style={{ margin: "0 0 20px", fontSize: "16px", color: "#ccc" }}>
          🎯 Per-Event Breakdown
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={eventChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="name" stroke="var(--chart-text)" fontSize={11} />
            <YAxis stroke="var(--chart-text)" fontSize={11} />
            <Tooltip
              contentStyle={{
                background: "#1a1a2e",
                border: "1px solid #333",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar
              dataKey="registrations"
              fill="var(--chart-danger)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="attendees"
              fill="var(--chart-primary)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="checkIns"
              fill="var(--chart-success)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
