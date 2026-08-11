import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { linearDecimate } from '../../../utils/dataDecimation';

const EventAttendanceChart = React.memo(function EventAttendanceChart({ data = [] }) {
  const decimatedData = useMemo(() => linearDecimate(data, 100), [data]);

  const handleExportCSV = () => {
    if (!data || data.length === 0) return;
    const headers = ['Event Name', 'Capacity', 'Attendance', 'Waitlist'];
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        `"${(row.name || '').replace(/"/g, '""')}","${row.capacity || 0}","${row.attendance || 0}","${row.waitlist || 0}"`
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'event_attendance.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="chart-container">
      <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Event Attendance</h2>
          <p>Capacity, attendance, and waitlist comparison.</p>
        </div>
        <button 
          onClick={handleExportCSV}
          disabled={!data || data.length === 0}
          style={{
            padding: '6px 12px',
            fontSize: '0.85rem',
            borderRadius: '6px',
            background: 'var(--c1, #cc1111)',
            color: '#fff',
            border: 'none',
            cursor: (!data || data.length === 0) ? 'not-allowed' : 'pointer',
            opacity: (!data || data.length === 0) ? 0.6 : 1,
            fontFamily: 'inherit'
          }}
        >
          Export CSV
        </button>
      </div>

      {data.length > 0 ? (
        <div className="chart-shell">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={decimatedData} margin={{ left: -10, right: 8 }}>
              <CartesianGrid
                stroke="var(--border-color, rgba(255,255,255,0.08))"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                minTickGap={16}
                tick={{ fill: 'var(--text-secondary, var(--t2, #888))', fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={40}
                tick={{ fill: 'var(--text-secondary, var(--t2, #888))', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-secondary, var(--bg-card, #0a0a0a))',
                  border: '1px solid var(--border-color, rgba(204, 17, 17, 0.28))',
                  borderRadius: '14px',
                  color: 'var(--text-primary, #fff)',
                  boxShadow: 'var(--shadow-card, 0 24px 60px rgba(0, 0, 0, 0.35))',
                }}
              />
              <Legend />
              <Bar dataKey="capacity" fill="#5b616b" radius={[8, 8, 0, 0]} />
              <Bar dataKey="attendance" fill="#cc1111" radius={[8, 8, 0, 0]} />
              <Bar dataKey="waitlist" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="chart-empty">No event data available.</div>
      )}
    </section>
  );
});

export default EventAttendanceChart;
