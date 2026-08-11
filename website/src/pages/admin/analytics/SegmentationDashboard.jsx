import React, { useState, useEffect } from 'react';
import apiClient from '../../../utils/apiClient.js';
import { getApiBase } from '../../../utils/runtimeConfig';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

export default function SegmentationDashboard() {
  const [segments, setSegments] = useState([]);
  const [cohortMonth, setCohortMonth] = useState('2026-06');
  const [cohortData, setCohortData] = useState(null);
  const [loading, setLoading] = useState(false);

  // New Segment form
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [condition, setCondition] = useState('events_count');

  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    try {
      const base = getApiBase();
      const res = await apiClient(`${base}/api/admin/analytics/segments`, {
        credentials: 'include',
      });
      setSegments(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSegment = async (e) => {
    e.preventDefault();
    try {
      const base = getApiBase();
      await apiClient(`${base}/api/admin/analytics/segments`, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          name,
          description: desc,
          rules_json: { condition, days: 30, value: 5 },
        }),
      });
      setName('');
      setDesc('');
      fetchSegments();
    } catch (err) {
      alert('Error creating segment: ' + err.message);
    }
  };

  const handleAction = async (segmentId, action) => {
    try {
      const base = getApiBase();
      const res = await apiClient(`${base}/api/admin/analytics/segments/${segmentId}/action`, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ action, template: 'default' }),
      });
      alert(`Action successful: ${res.count} users affected.`);
    } catch (err) {
      alert('Action failed: ' + err.message);
    }
  };

  const fetchCohort = async () => {
    setLoading(true);
    try {
      const base = getApiBase();
      const res = await apiClient(`${base}/api/admin/analytics/cohorts?month=${cohortMonth}`, {
        credentials: 'include',
      });
      setCohortData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Left Col: Segments list & Create */}
        <div>
          <h3>User Segments</h3>
          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              padding: '1.5rem',
              borderRadius: '8px',
              marginBottom: '2rem',
            }}
          >
            <h4 style={{ marginBottom: '1rem' }}>Create New Segment</h4>
            <form
              onSubmit={handleCreateSegment}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <input
                className="input-field"
                placeholder="Segment Name (e.g. Active Users)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                className="input-field"
                placeholder="Description"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                required
              />
              <select
                className="input-field"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              >
                <option value="events_count">High Activity (5+ events in 30 days)</option>
                <option value="inactivity">At Risk (Inactive for 60 days)</option>
              </select>
              <button type="submit" className="btn btn-primary">
                Create Segment
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {segments.map((s) => (
              <div
                key={s.id}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  padding: '1rem',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold' }}>{s.name}</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{s.description}</div>
                </div>
                <div>
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => handleAction(s.id, 'email')}
                  >
                    Send Email
                  </button>
                </div>
              </div>
            ))}
            {segments.length === 0 && <p>No segments defined yet.</p>}
          </div>
        </div>

        {/* Right Col: Cohort Analysis */}
        <div>
          <h3>Cohort Analysis</h3>
          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              padding: '1.5rem',
              borderRadius: '8px',
              marginBottom: '2rem',
            }}
          >
            <p style={{ opacity: 0.8, marginBottom: '1rem' }}>
              Analyze user retention for a specific signup month.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <input
                type="month"
                className="input-field"
                value={cohortMonth}
                onChange={(e) => setCohortMonth(e.target.value)}
              />
              <button className="btn btn-primary" onClick={fetchCohort} disabled={loading}>
                Analyze
              </button>
            </div>

            {loading && <p>Loading...</p>}

            {cohortData && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                  Total Users in Cohort: <strong>{cohortData.total_users}</strong>
                </div>
                <div style={{ fontSize: '1.2rem' }}>
                  Retained (Active &gt; 30d): <strong>{cohortData.retained_30d_users}</strong>
                </div>
                <div
                  style={{
                    marginTop: '1rem',
                    height: '10px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '5px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      background: 'var(--c1)',
                      width: `${cohortData.total_users > 0 ? (cohortData.retained_30d_users / cohortData.total_users) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
                <p
                  style={{
                    marginTop: '0.5rem',
                    textAlign: 'right',
                    fontSize: '0.9rem',
                    opacity: 0.8,
                  }}
                >
                  {cohortData.total_users > 0
                    ? ((cohortData.retained_30d_users / cohortData.total_users) * 100).toFixed(1)
                    : 0}
                  % Retention
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
