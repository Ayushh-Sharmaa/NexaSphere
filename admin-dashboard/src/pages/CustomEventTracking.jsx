import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || '';

const PROPERTY_TYPES = ['string', 'number', 'boolean', 'date'];

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString();
}

function plural(n, word) {
  return `${n.toLocaleString()} ${word}${n !== 1 ? 's' : ''}`;
}

// Simple sparkline using SVG
function Sparkline({ data, color = '#6366f1' }) {
  if (!data || data.length === 0)
    return <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>No data</span>;
  const values = data.map((d) => d.count);
  const max = Math.max(...values, 1);
  const w = 120,
    h = 36,
    pad = 2;
  const points = values
    .map((v, i) => {
      const x = pad + (i / Math.max(values.length - 1, 1)) * (w - pad * 2);
      const y = h - pad - (v / max) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PropertyBuilder({ properties, onChange }) {
  function addProp() {
    onChange([...properties, { name: '', type: 'string', required: false }]);
  }
  function removeProp(idx) {
    onChange(properties.filter((_, i) => i !== idx));
  }
  function updateProp(idx, field, value) {
    const updated = properties.map((p, i) => (i === idx ? { ...p, [field]: value } : p));
    onChange(updated);
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {properties.map((prop, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              placeholder="Property name"
              value={prop.name}
              onChange={(e) => updateProp(idx, 'name', e.target.value)}
              style={inputStyle}
            />
            <select
              value={prop.type}
              onChange={(e) => updateProp(idx, 'type', e.target.value)}
              style={{ ...inputStyle, width: '110px', flex: 'none' }}
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <label
              style={{
                fontSize: '0.8rem',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
              }}
            >
              <input
                type="checkbox"
                checked={prop.required || false}
                onChange={(e) => updateProp(idx, 'required', e.target.checked)}
              />
              Required
            </label>
            <button onClick={() => removeProp(idx)} style={dangerBtnStyle}>
              ✕
            </button>
          </div>
        ))}
      </div>
      {properties.length < 20 && (
        <button onClick={addProp} style={{ ...ghostBtnStyle, marginTop: '8px' }}>
          + Add Property
        </button>
      )}
    </div>
  );
}

function EventDefinitionCard({ definition, onSelect, onEdit, onDelete }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '18px 20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>
              {definition.name}
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '10px',
                background: definition.is_active ? '#dcfce7' : '#fee2e2',
                color: definition.is_active ? '#15803d' : '#dc2626',
              }}
            >
              {definition.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          {definition.description && (
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
              {definition.description}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => onEdit(definition)} style={ghostBtnStyle} title="Edit">
            ✏️
          </button>
          <button onClick={() => onDelete(definition.id)} style={dangerBtnStyle} title="Delete">
            🗑
          </button>
        </div>
      </div>
      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
        {plural((definition.properties || []).length, 'property')} &bull; Created by{' '}
        <strong>{definition.created_by}</strong> &bull; {formatDate(definition.created_at)}
      </div>
      <button onClick={() => onSelect(definition)} style={primaryBtnStyle}>
        View Analytics →
      </button>
    </div>
  );
}

function AnalyticsDashboard({ definition, onBack }) {
  const [analytics, setAnalytics] = useState(null);
  const [logs, setLogs] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [logsPage, setLogsPage] = useState(1);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, logsRes] = await Promise.all([
        fetch(
          `${API_BASE}/api/admin/custom-events/definitions/${definition.id}/analytics?days=${days}`,
          { credentials: 'include' }
        ),
        fetch(
          `${API_BASE}/api/admin/custom-events/definitions/${definition.id}/logs?page=${logsPage}&limit=20`,
          { credentials: 'include' }
        ),
      ]);
      if (analyticsRes.ok) {
        const d = await analyticsRes.json();
        setAnalytics(d.analytics);
      }
      if (logsRes.ok) {
        const d = await logsRes.json();
        setLogs(d);
      }
    } finally {
      setLoading(false);
    }
  }, [definition.id, days, logsPage]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  function handleExport() {
    window.location.href = `${API_BASE}/api/admin/custom-events/definitions/${definition.id}/export`;
  }

  const propNames = (definition.properties || []).map((p) => p.name);

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack} style={ghostBtnStyle}>
            ← Back
          </button>
          <div>
            <h3 style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>{definition.name}</h3>
            {definition.description && (
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                {definition.description}
              </p>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            style={{ ...inputStyle, width: '130px' }}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last 365 days</option>
          </select>
          <button onClick={handleExport} style={primaryBtnStyle}>
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
          Loading analytics…
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            {[
              { label: 'Total (in range)', value: analytics?.total ?? 0, icon: '📊' },
              { label: 'All-Time Total', value: analytics?.allTimeTotal ?? 0, icon: '📈' },
              { label: 'Unique Users', value: analytics?.uniqueUsers ?? 0, icon: '👤' },
              { label: 'Unique Sessions', value: analytics?.uniqueSessions ?? 0, icon: '🔗' },
            ].map(({ label, value, icon }) => (
              <div
                key={label}
                style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{icon}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b' }}>
                  {value.toLocaleString()}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '2px' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Trend Chart */}
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e2e8f0',
              marginBottom: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <h4 style={{ margin: '0 0 16px', color: '#1e293b', fontWeight: 600 }}>
              Daily Occurrences (Last {days} days)
            </h4>
            {analytics?.dailyBreakdown?.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  alignItems: 'flex-end',
                  height: '100px',
                  overflowX: 'auto',
                }}
              >
                {(() => {
                  const breakdown = analytics.dailyBreakdown;
                  const max = Math.max(...breakdown.map((d) => d.count), 1);
                  return breakdown.map((day) => (
                    <div
                      key={day.date}
                      title={`${day.date}: ${day.count}`}
                      style={{
                        flex: '1 0 8px',
                        maxWidth: '30px',
                        background: '#6366f1',
                        borderRadius: '3px 3px 0 0',
                        height: `${Math.max(4, (day.count / max) * 90)}px`,
                        transition: 'height 0.3s',
                        cursor: 'pointer',
                        opacity: 0.85,
                      }}
                    />
                  ));
                })()}
              </div>
            ) : (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
                No occurrences in this period.
              </div>
            )}
          </div>

          {/* Recent Logs Table */}
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h4 style={{ margin: 0, color: '#1e293b', fontWeight: 600 }}>
                Recent Logs ({logs?.total?.toLocaleString() ?? 0} total)
              </h4>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                  disabled={logsPage <= 1}
                  style={ghostBtnStyle}
                >
                  ← Prev
                </button>
                <span style={{ padding: '4px 8px', fontSize: '0.875rem', color: '#64748b' }}>
                  Page {logsPage}
                </span>
                <button
                  onClick={() => setLogsPage((p) => p + 1)}
                  disabled={logs && logsPage * 20 >= logs.total}
                  style={ghostBtnStyle}
                >
                  Next →
                </button>
              </div>
            </div>
            {logs?.logs?.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                      <th style={thStyle}>Time</th>
                      <th style={thStyle}>User ID</th>
                      <th style={thStyle}>Session</th>
                      {propNames.map((p) => (
                        <th key={p} style={thStyle}>
                          {p}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.logs.map((log) => {
                      const props =
                        typeof log.properties === 'string'
                          ? JSON.parse(log.properties)
                          : log.properties || {};
                      return (
                        <tr key={log.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={tdStyle}>{formatDate(log.occurred_at)}</td>
                          <td style={tdStyle}>
                            {log.user_id || <em style={{ color: '#94a3b8' }}>anon</em>}
                          </td>
                          <td style={tdStyle}>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontSize: '0.75rem',
                                color: '#64748b',
                              }}
                            >
                              {(log.session_id || '').slice(0, 12)}…
                            </span>
                          </td>
                          {propNames.map((p) => (
                            <td key={p} style={tdStyle}>
                              {props[p] !== undefined ? (
                                String(props[p])
                              ) : (
                                <em style={{ color: '#cbd5e1' }}>—</em>
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: '24px' }}>
                No logs yet.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export function CustomEventTracking() {
  const [definitions, setDefinitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDef, setSelectedDef] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDef, setEditingDef] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', properties: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchDefinitions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/custom-events/definitions`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setDefinitions(data.definitions || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDefinitions();
  }, [fetchDefinitions]);

  function openCreate() {
    setEditingDef(null);
    setForm({ name: '', description: '', properties: [] });
    setError(null);
    setShowForm(true);
  }

  function openEdit(def) {
    setEditingDef(def);
    setForm({
      name: def.name,
      description: def.description || '',
      properties: def.properties || [],
    });
    setError(null);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError('Event name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const url = editingDef
        ? `${API_BASE}/api/admin/custom-events/definitions/${editingDef.id}`
        : `${API_BASE}/api/admin/custom-events/definitions`;
      const method = editingDef ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save');
        return;
      }
      setShowForm(false);
      fetchDefinitions();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this event definition and all its logs? This cannot be undone.'))
      return;
    await fetch(`${API_BASE}/api/admin/custom-events/definitions/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    fetchDefinitions();
  }

  // -- Render --
  if (selectedDef) {
    return (
      <div style={pageStyle}>
        <AnalyticsDashboard definition={selectedDef} onBack={() => setSelectedDef(null)} />
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '1.5rem' }}>
            🎯 Custom Event Tracking
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Define custom events, track their occurrences, and export analytics — no code required.
          </p>
        </div>
        <button onClick={openCreate} style={primaryBtnStyle}>
          + New Event
        </button>
      </div>

      {/* Create / Edit Form Modal */}
      {showForm && (
        <div style={overlayStyle}>
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '28px',
              width: '560px',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
          >
            <h3 style={{ margin: '0 0 20px', color: '#1e293b', fontWeight: 700 }}>
              {editingDef ? 'Edit Event' : 'Create Custom Event'}
            </h3>

            <label style={labelStyle}>Event Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. button_clicked, video_watched"
              style={{
                ...inputStyle,
                marginBottom: '14px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />

            <label style={labelStyle}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What does this event track?"
              rows={2}
              style={{
                ...inputStyle,
                marginBottom: '14px',
                width: '100%',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />

            <label style={labelStyle}>Event Properties</label>
            <PropertyBuilder
              properties={form.properties}
              onChange={(props) => setForm((f) => ({ ...f, properties: props }))}
            />

            {error && (
              <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '12px' }}>
                ⚠ {error}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginTop: '20px',
                justifyContent: 'flex-end',
              }}
            >
              <button onClick={() => setShowForm(false)} style={ghostBtnStyle}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} style={primaryBtnStyle}>
                {saving ? 'Saving…' : editingDef ? 'Save Changes' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Definitions Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px' }}>
          Loading event definitions…
        </div>
      ) : definitions.length === 0 ? (
        <div
          style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '60px',
            textAlign: 'center',
            border: '1px dashed #cbd5e1',
            color: '#94a3b8',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎯</div>
          <p style={{ fontWeight: 600, color: '#64748b', marginBottom: '16px' }}>
            No custom events yet.
          </p>
          <button onClick={openCreate} style={primaryBtnStyle}>
            Create Your First Event
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {definitions.map((def) => (
            <EventDefinitionCard
              key={def.id}
              definition={def}
              onSelect={setSelectedDef}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const pageStyle = {
  padding: '24px',
  fontFamily: 'Inter, system-ui, sans-serif',
  background: '#f8fafc',
  minHeight: '100vh',
};

const inputStyle = {
  padding: '8px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  fontSize: '0.875rem',
  color: '#1e293b',
  background: '#f8fafc',
  outline: 'none',
};

const primaryBtnStyle = {
  padding: '8px 18px',
  background: '#6366f1',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 600,
  fontSize: '0.875rem',
  cursor: 'pointer',
};

const ghostBtnStyle = {
  padding: '7px 14px',
  background: '#f1f5f9',
  color: '#475569',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  fontWeight: 500,
  fontSize: '0.875rem',
  cursor: 'pointer',
};

const dangerBtnStyle = {
  padding: '6px 10px',
  background: '#fee2e2',
  color: '#dc2626',
  border: 'none',
  borderRadius: '6px',
  fontWeight: 600,
  fontSize: '0.8rem',
  cursor: 'pointer',
};

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const labelStyle = {
  display: 'block',
  fontWeight: 600,
  color: '#374151',
  fontSize: '0.85rem',
  marginBottom: '6px',
};

const thStyle = {
  textAlign: 'left',
  color: '#64748b',
  fontWeight: 600,
  padding: '8px 10px',
  fontSize: '0.8rem',
  background: '#f8fafc',
};

const tdStyle = {
  padding: '8px 10px',
  color: '#374151',
  verticalAlign: 'top',
};
