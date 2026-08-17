/**
 * Virtualized System Metrics Table Component.
 * Renders only visible rows based on container scroll position to maintain 60 FPS performance (#4148).
 */

import React, { useState, useRef, useMemo } from "react";

export default function VirtualizedMetricsTable({
  metricsData = [],
  rowHeight = 40,
  containerHeight = 400,
  buffer = 5,
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const totalHeight = metricsData.length * rowHeight;

  const { startIndex, endIndex, visibleData, offsetY } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - buffer);
    const visibleCount = Math.ceil(containerHeight / rowHeight);
    const end = Math.min(metricsData.length, start + visibleCount + buffer * 2);
    const visible = metricsData.slice(start, end);
    const offset = start * rowHeight;

    return {
      startIndex: start,
      endIndex: end,
      visibleData: visible,
      offsetY: offset,
    };
  }, [scrollTop, metricsData, rowHeight, containerHeight, buffer]);

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height: containerHeight,
        overflowY: "auto",
        position: "relative",
      }}
      className="virtualized-metrics-container border border-zinc-800 rounded-lg bg-zinc-900/50"
    >
      <div style={{ height: totalHeight, width: "100%", position: "relative" }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-800 text-zinc-400 sticky top-0">
              <tr>
                <th className="px-4 py-2">Timestamp</th>
                <th className="px-4 py-2">Service</th>
                <th className="px-4 py-2">CPU (%)</th>
                <th className="px-4 py-2">Memory (MB)</th>
                <th className="px-4 py-2">Latency (ms)</th>
              </tr>
            </thead>
            <tbody>
              {visibleData.map((row, idx) => (
                <tr
                  key={row.id || startIndex + idx}
                  style={{ height: rowHeight }}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                >
                  <td className="px-4 py-2">{row.timestamp}</td>
                  <td className="px-4 py-2 font-medium text-white">
                    {row.service}
                  </td>
                  <td className="px-4 py-2">{row.cpu}</td>
                  <td className="px-4 py-2">{row.memory}</td>
                  <td className="px-4 py-2">{row.latency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
