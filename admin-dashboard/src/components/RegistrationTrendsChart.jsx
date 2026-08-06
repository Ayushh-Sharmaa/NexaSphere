/**
 * Registration Trends Chart Component
 * Displays registration trends over time using Recharts
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from './Skeleton';
import analyticsAPI from '../services/analyticsAPI.js';

export default function RegistrationTrendsChart({
  eventId,
  selectedTimeWindow,
  onTimeWindowChange,
  data = [],
}) {
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState(data);
  const [chartType, setChartType] = useState('line');

  const timeWindows = ['1 day', '7 days', '30 days'];

  useEffect(() => {
    if (data && data.length > 0) {
      setChartData(data);
    }
  }, [data]);

  const handleTimeWindowChange = async (newWindow) => {
    setLoading(true);
    try {
      const trends = await analyticsAPI.getRegistrationTrends(eventId, newWindow);
      setChartData(trends);
      onTimeWindowChange(newWindow);
    } catch (err) {
      console.error('Failed to fetch trends:', err);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`Date: ${label}`}</p>
          {payload.map((entry, idx) => (
            <p key={idx} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-wrapper registration-trends-chart">
      <div className="chart-header">
        <h2>📈 Registration Trends</h2>
        <div className="chart-controls">
          <div className="button-group">
            {timeWindows.map((window) => (
              <button
                key={window}
                className={`time-btn ${selectedTimeWindow === window ? 'active' : ''}`}
                onClick={() => handleTimeWindowChange(window)}
                disabled={loading}
              >
                {window}
              </button>
            ))}
          </div>
          <div className="chart-type-selector">
            <label>Chart Type:</label>
            <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
              <option value="line">Line Chart</option>
              <option value="area">Area Chart</option>
              <option value="bar">Bar Chart</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '20px' }}>
          <Skeleton height={350} />
        </div>
      ) : chartData && chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={350}>
          {chartType === 'line' && (
            <LineChart data={useMemo(() => chartData, [chartData])}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="registrations"
                stroke="var(--chart-primary)"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="checkedIn"
                stroke="var(--chart-success)"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          )}

          {chartType === 'area' && (
            <AreaChart data={useMemo(() => chartData, [chartData])}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="registrations"
                fill="url(#colorRegs)"
                stroke="var(--chart-primary)"
              />
              <Area
                type="monotone"
                dataKey="checkedIn"
                fill="url(#colorCheckins)"
                stroke="var(--chart-success)"
              />
            </AreaChart>
          )}

          {chartType === 'bar' && (
            <BarChart data={useMemo(() => chartData, [chartData])}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="registrations" fill="var(--chart-primary)" />
              <Bar dataKey="checkedIn" fill="var(--chart-success)" />
            </BarChart>
          )}
        </ResponsiveContainer>
      ) : (
        <div className="no-data">
          <p>No trend data available</p>
        </div>
      )}
    </div>
  );
}
