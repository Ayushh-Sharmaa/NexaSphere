import { useState, useMemo } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = ["8am", "10am", "12pm", "2pm", "4pm", "6pm", "8pm", "Late"];

/**
 * AttendanceHeatmap
 * Renders a 7×8 (day × time-slot) colour-coded attendance density grid.
 *
 * Props:
 *   registrations — array of { registeredAt: ISO string } objects
 *                   OR null/undefined (uses synthetic demo data)
 *   title         — optional heading override
 */
export function AttendanceHeatmap({
  registrations,
  title = "Attendance Density Heatmap",
}) {
  const [tooltip, setTooltip] = useState(null); // { day, hour, count, pct, x, y }
  const [exportMsg, setExportMsg] = useState("");

  /* ── Build 7×8 matrix ── */
  const matrix = useMemo(() => {
    const grid = Array.from({ length: 7 }, () => Array(8).fill(0));

    const slots = [8, 10, 12, 14, 16, 18, 20, 22]; // hour boundaries

    if (registrations && registrations.length > 0) {
      for (const r of registrations) {
        try {
          const d = new Date(r.registeredAt || r.createdAt || r.date);
          if (isNaN(d)) continue;
          const dow = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
          const h = d.getHours();
          const slot = slots.findIndex(
            (s, i) => h >= s && (i === slots.length - 1 || h < slots[i + 1])
          );
          if (slot >= 0) grid[dow][slot]++;
        } catch {}
      }
    } else {
      // Synthetic demo data — realistic-looking bell curve
      const peaks = [
        [0, 2, 12],
        [0, 3, 18],
        [0, 4, 9],
        [1, 2, 22],
        [1, 3, 31],
        [1, 4, 15],
        [1, 5, 7],
        [2, 1, 8],
        [2, 2, 19],
        [2, 3, 24],
        [2, 4, 11],
        [3, 2, 14],
        [3, 3, 28],
        [3, 4, 20],
        [3, 5, 10],
        [4, 3, 35],
        [4, 4, 26],
        [4, 5, 14],
        [5, 4, 8],
        [5, 5, 16],
        [5, 6, 12],
        [6, 5, 5],
        [6, 6, 9],
      ];
      for (const [d, h, v] of peaks) grid[d][h] = v;
    }

    return grid;
  }, [registrations]);

  const maxVal = useMemo(() => Math.max(1, ...matrix.flat()), [matrix]);
  const total = useMemo(
    () => matrix.flat().reduce((s, v) => s + v, 0),
    [matrix]
  );

  /* ── Colour interpolation ── */
  function cellColor(count) {
    if (count === 0) return "rgba(255,255,255,0.03)";
    const pct = count / maxVal;
    if (pct < 0.25) return `rgba(204,17,17,${0.1 + pct * 0.4})`;
    if (pct < 0.5) return `rgba(204,17,17,${0.2 + pct * 0.5})`;
    if (pct < 0.75) return `rgba(204,17,17,${0.45 + pct * 0.35})`;
    return `rgba(204,17,17,${0.75 + pct * 0.25})`;
  }

  /* ── CSV Export ── */
  function exportCSV() {
    const header = ["Day", ...HOURS].join(",");
    const rows = DAYS.map((day, di) => [day, ...matrix[di]].join(","));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance_heatmap.csv";
    a.click();
    URL.revokeObjectURL(url);
    setExportMsg("Exported!");
    setTimeout(() => setExportMsg(""), 2000);
  }

  return (
    <div
      style={{
        background: "var(--admin-bg-card, #1a1a2e)",
        border: "1px solid var(--admin-border, #333)",
        borderRadius: 14,
        padding: "20px 24px",
        marginBottom: 24,
        position: "relative",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontFamily: "Rajdhani,sans-serif",
              fontSize: "1.1rem",
              color: "var(--admin-text, #eee)",
            }}
          >
            🔥 {title}
          </h3>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "0.78rem",
              color: "var(--admin-text-muted, #888)",
            }}
          >
            {total > 0
              ? `${total} registrations across the week`
              : "Showing demo data — select an event above"}
          </p>
        </div>
        <button
          onClick={exportCSV}
          style={{
            background: "rgba(204,17,17,0.12)",
            border: "1px solid rgba(204,17,17,0.3)",
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: "0.8rem",
            color: "#CC1111",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {exportMsg || "⬇ Export CSV"}
        </button>
      </div>

      {/* Grid */}
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 480 }}>
          {/* Hour labels */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "52px repeat(8, 1fr)",
              gap: 4,
              marginBottom: 4,
            }}
          >
            <div />
            {HOURS.map((h) => (
              <div
                key={h}
                style={{
                  textAlign: "center",
                  fontSize: "0.65rem",
                  color: "var(--admin-text-muted, #888)",
                  fontFamily: "monospace",
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Day rows */}
          {DAYS.map((day, di) => (
            <div
              key={day}
              style={{
                display: "grid",
                gridTemplateColumns: "52px repeat(8, 1fr)",
                gap: 4,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: "0.72rem",
                  color: "var(--admin-text-muted, #888)",
                  fontFamily: "monospace",
                  fontWeight: 600,
                }}
              >
                {day}
              </div>
              {matrix[di].map((count, hi) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div
                    key={hi}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({
                        day,
                        hour: HOURS[hi],
                        count,
                        pct,
                        x: rect.left,
                        y: rect.top,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      height: 32,
                      borderRadius: 6,
                      background: cellColor(count),
                      border: "1px solid rgba(255,255,255,0.04)",
                      cursor: count > 0 ? "pointer" : "default",
                      transition: "transform 0.15s, box-shadow 0.15s",
                      position: "relative",
                    }}
                    onMouseOver={(e) => {
                      if (count > 0) {
                        e.currentTarget.style.transform = "scale(1.08)";
                        e.currentTarget.style.boxShadow = `0 0 12px rgba(204,17,17,${(count / maxVal) * 0.6})`;
                      }
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}
      >
        <span
          style={{
            fontSize: "0.72rem",
            color: "var(--admin-text-muted, #888)",
          }}
        >
          Low
        </span>
        {[0.1, 0.25, 0.5, 0.75, 1.0].map((v) => (
          <div
            key={v}
            style={{
              width: 24,
              height: 14,
              borderRadius: 4,
              background: cellColor(Math.round(v * maxVal)),
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          />
        ))}
        <span
          style={{
            fontSize: "0.72rem",
            color: "var(--admin-text-muted, #888)",
          }}
        >
          High
        </span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "fixed",
            top: tooltip.y - 64,
            left: tooltip.x - 20,
            background: "rgba(20,20,35,0.98)",
            border: "1px solid rgba(204,17,17,0.4)",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: "0.78rem",
            color: "#eee",
            pointerEvents: "none",
            zIndex: 9999,
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 2 }}>
            {tooltip.day} · {tooltip.hour}
          </div>
          <div>{tooltip.count} registrations</div>
          {tooltip.pct > 0 && (
            <div style={{ color: "#CC1111", marginTop: 2 }}>
              {tooltip.pct}% of total
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AttendanceHeatmap;
