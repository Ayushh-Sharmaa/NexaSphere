/**
 * Check-in Statistics Chart Component
 * Displays check-in status breakdown with pie/doughnut chart
 */

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

export default function CheckInStatsChart({ stats }) {
  if (!stats || Object.keys(stats).length === 0) {
    return (
      <div className="chart-wrapper checkin-stats-chart">
        <div className="chart-header">
          <h2>🔐 Check-in Status</h2>
        </div>
        <div className="no-data">
          <p>No check-in data available</p>
        </div>
      </div>
    );
  }

  // Transform stats into chart data
  const chartData = Object.entries(stats).map(([status, data]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: data.count,
    percentage: parseFloat(data.percentage),
  }));

  const COLORS = {
    checked_in: "var(--chart-success)",
    registered: "var(--chart-warning)",
    cancelled: "var(--chart-danger)",
    no_show: "var(--chart-text)",
  };

  const getStatusColor = (status) => {
    const statusKey = status.toLowerCase().replace(/\s+/g, "_");
    return COLORS[statusKey] || "var(--chart-primary)";
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { name, value, percentage } = payload[0];
      return (
        <div className="custom-tooltip">
          <p className="label">{name}</p>
          <p className="value">{`Count: ${value}`}</p>
          <p className="percentage">{`${percentage}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-wrapper checkin-stats-chart">
      <div className="chart-header">
        <h2>🔐 Check-in Status Breakdown</h2>
      </div>

      <div className="chart-content">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              fill="var(--chart-primary)"
              paddingAngle={2}
              dataKey="value"
              label={(entry) => `${entry.name} (${entry.value})`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        <div className="stats-legend">
          {chartData.map((stat, idx) => (
            <div key={idx} className="stat-item">
              <div
                className="stat-color"
                style={{ backgroundColor: getStatusColor(stat.name) }}
              ></div>
              <div className="stat-info">
                <span className="stat-name">{stat.name}</span>
                <span className="stat-value">
                  {stat.value} ({stat.percentage}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
