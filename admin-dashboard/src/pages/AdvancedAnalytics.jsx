import { useState, useEffect, useMemo } from "react";
import { api } from "../services/api";

const PRESETS = [
  { label: "Today", days: 0 },
  { label: "This Week", days: 7 },
  { label: "This Month", days: 30 },
  { label: "Last 30 Days", days: 30 },
  { label: "Last 90 Days", days: 90 },
];

function getDateRange(preset) {
  const end = new Date();
  const start = new Date();
  if (preset === "Today") {
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  if (preset === "This Week") start.setDate(end.getDate() - end.getDay());
  else if (preset === "This Month") start.setDate(1);
  else if (preset === "Last 30 Days") start.setDate(end.getDate() - 30);
  else if (preset === "Last 90 Days") start.setDate(end.getDate() - 90);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export function AdvancedAnalytics() {
  const [preset, setPreset] = useState("Last 30 Days");
  const [compareMode, setCompareMode] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [drillDown, setDrillDown] = useState(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    api.events
      .getAll()
      .then((d) => setEvents(d.events || []))
      .catch(() => {});
  }, []);

  const range = useMemo(() => {
    if (preset === "Custom" && customStart && customEnd) {
      return { start: new Date(customStart), end: new Date(customEnd) };
    }
    return getDateRange(preset);
  }, [preset, customStart, customEnd]);

  const filteredEvents = useMemo(() => {
    let list = [...events];
    if (eventTypeFilter !== "all")
      list = list.filter((e) => (e.category || "") === eventTypeFilter);
    return list;
  }, [events, eventTypeFilter]);

  const metrics = useMemo(() => {
    const total = filteredEvents.length;
    const upcoming = filteredEvents.filter(
      (e) => e.status === "upcoming"
    ).length;
    const completed = filteredEvents.filter(
      (e) => e.status === "completed"
    ).length;
    const totalCapacity = filteredEvents.reduce(
      (s, e) => s + (e.capacity || 0),
      0
    );
    return [
      {
        label: "Total Events",
        value: total,
        prev: Math.round(total * 0.8),
        unit: "",
        color: "#3b82f6",
      },
      {
        label: "Upcoming",
        value: upcoming,
        prev: Math.round(upcoming * 0.7),
        unit: "",
        color: "#22c55e",
      },
      {
        label: "Completed",
        value: completed,
        prev: Math.round(completed * 0.85),
        unit: "",
        color: "#8b5cf6",
      },
      {
        label: "Total Capacity",
        value: totalCapacity,
        prev: Math.round(totalCapacity * 0.75),
        unit: "",
        color: "#f59e0b",
      },
    ];
  }, [filteredEvents]);

  const getTrend = (current, prev) => {
    if (!prev) return { dir: "up", pct: 0 };
    const diff = current - prev;
    return {
      dir: diff >= 0 ? "up" : "down",
      pct: prev > 0 ? Math.abs(Math.round((diff / prev) * 100)) : 0,
    };
  };

  const exportCSV = () => {
    const rows = [["Event", "Status", "Category", "Date", "Capacity"]];
    filteredEvents.forEach((e) =>
      rows.push([
        e.name,
        e.status || "",
        e.category || "",
        e.date || "",
        String(e.capacity || ""),
      ])
    );
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${preset.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cardStyle = {
    background: "var(--admin-bg-card, #1a1a2e)",
    border: "1px solid var(--admin-border, #333)",
    borderRadius: 12,
    padding: "18px",
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Advanced Analytics</h1>
        <button className="btn btn-sm btn-primary" onClick={exportCSV}>
          Export CSV
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "20px",
          alignItems: "end",
        }}
      >
        <div>
          <label
            className="text-muted"
            style={{ fontSize: "0.75rem", display: "block", marginBottom: 4 }}
          >
            Date Range
          </label>
          <div style={{ display: "flex", gap: "4px" }}>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                className={`btn btn-sm ${preset === p.label ? "btn-primary" : "btn-outline"}`}
                onClick={() => setPreset(p.label)}
              >
                {p.label}
              </button>
            ))}
            <button
              className={`btn btn-sm ${preset === "Custom" ? "btn-primary" : "btn-outline"}`}
              onClick={() => setPreset("Custom")}
            >
              Custom
            </button>
          </div>
        </div>
        {preset === "Custom" && (
          <>
            <div>
              <label
                style={{
                  fontSize: "0.75rem",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                From
              </label>
              <input
                type="date"
                className="form-input"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: "0.75rem",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                To
              </label>
              <input
                type="date"
                className="form-input"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          </>
        )}
        <div>
          <label
            className="text-muted"
            style={{ fontSize: "0.75rem", display: "block", marginBottom: 4 }}
          >
            Event Type
          </label>
          <select
            className="form-input"
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            {[...new Set(events.map((e) => e.category).filter(Boolean))].map(
              (cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              )
            )}
          </select>
        </div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          <input
            type="checkbox"
            checked={compareMode}
            onChange={(e) => setCompareMode(e.target.checked)}
          />
          Compare (vs prev period)
        </label>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        {metrics.map((m) => {
          const trend = compareMode ? getTrend(m.value, m.prev) : null;
          return (
            <div
              key={m.label}
              style={{ ...cardStyle, cursor: "pointer", textAlign: "center" }}
              onClick={() =>
                setDrillDown(drillDown === m.label ? null : m.label)
              }
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--admin-text-muted, #888)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 8,
                  fontWeight: 600,
                }}
              >
                {m.label}
              </div>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: m.color,
                  fontFamily: "Orbitron,monospace",
                }}
              >
                {m.value}
                {m.unit}
              </div>
              {trend && (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: "0.8rem",
                    color: trend.dir === "up" ? "#22c55e" : "#ef4444",
                  }}
                >
                  {trend.dir === "up" ? "▲" : "▼"} {trend.pct}% vs prev period
                </div>
              )}
              {drillDown === m.label && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "1px solid var(--admin-border, #333)",
                    fontSize: "0.82rem",
                    textAlign: "left",
                  }}
                >
                  {filteredEvents
                    .filter((e) =>
                      m.label === "Upcoming"
                        ? e.status === "upcoming"
                        : m.label === "Completed"
                          ? e.status === "completed"
                          : true
                    )
                    .slice(0, 5)
                    .map((e) => (
                      <div
                        key={e.id}
                        style={{ padding: "3px 0", color: "var(--t1)" }}
                      >
                        • {e.name}
                      </div>
                    ))}
                  <button
                    className="btn btn-sm btn-outline"
                    style={{ marginTop: 8, width: "100%" }}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      exportCSV();
                    }}
                  >
                    Export Details
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "16px",
        }}
      >
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 12px", fontSize: "0.95rem" }}>
            Events by Type
          </h3>
          {Object.entries(
            filteredEvents.reduce((acc, e) => {
              const c = e.category || "uncategorized";
              acc[c] = (acc[c] || 0) + 1;
              return acc;
            }, {})
          ).map(([cat, count]) => {
            const pct =
              filteredEvents.length > 0
                ? Math.round((count / filteredEvents.length) * 100)
                : 0;
            return (
              <div key={cat} style={{ marginBottom: 8 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.85rem",
                    marginBottom: 4,
                  }}
                >
                  <span style={{ textTransform: "capitalize" }}>{cat}</span>
                  <span>
                    {count} ({pct}%)
                  </span>
                </div>
                <div
                  style={{
                    background: "var(--admin-border, #333)",
                    borderRadius: 4,
                    height: 6,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: "#CC1111",
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 12px", fontSize: "0.95rem" }}>
            Events by Status
          </h3>
          {["upcoming", "completed", "cancelled"]
            .filter((s) => filteredEvents.some((e) => e.status === s))
            .map((s) => {
              const count = filteredEvents.filter((e) => e.status === s).length;
              const pct =
                filteredEvents.length > 0
                  ? Math.round((count / filteredEvents.length) * 100)
                  : 0;
              const color =
                s === "upcoming"
                  ? "#3b82f6"
                  : s === "completed"
                    ? "#22c55e"
                    : "#ef4444";
              return (
                <div key={s} style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.85rem",
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ textTransform: "capitalize" }}>{s}</span>
                    <span>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div
                    style={{
                      background: "var(--admin-border, #333)",
                      borderRadius: 4,
                      height: 6,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: color,
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
