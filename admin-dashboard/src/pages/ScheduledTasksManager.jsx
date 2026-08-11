/**
 * ScheduledTasksManager.jsx
 * Admin dashboard page for Scheduled Task & Job Management (Issue #1770)
 *
 * Features:
 *  - Stats overview cards
 *  - Filterable task list with status indicators
 *  - Enable / disable toggle
 *  - Cron expression editor
 *  - Manual "Run Now" trigger
 *  - Per-task execution history panel
 *  - Auto-refresh every 30 s
 */

import { useCallback, useEffect, useState } from 'react';
import { AdminIcon } from '../components/AdminIcon';
import { useLogoutAwareInterval } from '../hooks/useLogoutAwareInterval';
import { useToast } from '../hooks/useToast';

// ─── Config ───────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || '';
const REFRESH_MS = 30_000;

const CATEGORY_COLORS = {
  email: '#3b82f6',
  analytics: '#8b5cf6',
  system: '#6b7280',
  reports: '#f59e0b',
  users: '#10b981',
  certificates: '#ec4899',
};

const STATUS_COLORS = {
  success: '#22c55e',
  failed: '#ef4444',
  running: '#f59e0b',
  pending: '#6b7280',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString();
}

function fmtDuration(ms) {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function statusBadge(status) {
  const color = STATUS_COLORS[status] ?? '#6b7280';
  return (
    <span
      className="status-badge"
      style={{ background: color + '22', color, border: `1px solid ${color}44` }}
    >
      {status}
    </span>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ color: color || 'var(--red)' }}>
        <AdminIcon name={icon} size={22} aria-hidden="true" />
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function HistoryPanel({ taskId, onClose }) {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/admin/scheduled-tasks/${taskId}/history?limit=20`,
          {
            credentials: 'include',
          }
        );
        const data = await res.json();
        setHistory(data.history || []);
      } catch {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [taskId]);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Execution History">
      <div className="modal" style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <h3>Execution History</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close history">
            <AdminIcon name="X" size={18} />
          </button>
        </div>

        {loading && <div className="skeleton" style={{ height: 120 }} />}

        {!loading && history.length === 0 && (
          <p className="empty-state" style={{ padding: '24px 0' }}>
            No executions recorded yet.
          </p>
        )}

        {!loading && history.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="tasks-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Started At', 'Duration', 'Status', 'Error'].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        padding: '8px 10px',
                        fontSize: 11,
                        color: 'var(--text2)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 10px', fontSize: 12 }}>{fmtDate(row.startedAt)}</td>
                    <td style={{ padding: '8px 10px', fontSize: 12 }}>
                      {fmtDuration(row.durationMs)}
                    </td>
                    <td style={{ padding: '8px 10px' }}>{statusBadge(row.status)}</td>
                    <td
                      style={{
                        padding: '8px 10px',
                        fontSize: 12,
                        color: 'var(--text2)',
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row.error || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function CronEditorModal({ task, onSave, onClose }) {
  const [cron, setCron] = useState(task.cron);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await onSave(task.id, cron);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update schedule');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Edit Schedule">
      <div className="modal">
        <div className="modal-header">
          <h3>Edit Schedule — {task.name}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close editor">
            <AdminIcon name="X" size={18} />
          </button>
        </div>

        <div className="form">
          <div className="form-row">
            <label htmlFor="cron-input">Cron Expression (5-field)</label>
            <input
              id="cron-input"
              value={cron}
              onChange={(e) => setCron(e.target.value)}
              placeholder="e.g. 0 8 * * *"
              style={{ fontFamily: 'monospace' }}
            />
            <span style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>
              Fields: minute hour day-of-month month day-of-week
            </span>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSave} disabled={saving || !cron.trim()}>
              {saving ? 'Saving…' : 'Save Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ScheduledTasksManager() {
  const { showToast } = useToast();

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filter, setFilter] = useState('all'); // all | category
  const [searchQuery, setSearch] = useState('');
  const [historyTask, setHistoryTask] = useState(null); // task id or null
  const [editCronTask, setEditCron] = useState(null); // task object or null
  const [triggering, setTriggering] = useState({}); // taskId → bool

  // ── Data fetch ─────────────────────────────────────────────────────────────

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/scheduled-tasks`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTasks(data.tasks || []);
      setStats(data.stats || null);
      setError('');
    } catch (err) {
      if (!silent) setError(err.message || 'Failed to load tasks');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refreshTasks = useCallback(() => load(true), [load]);

  useLogoutAwareInterval(refreshTasks, REFRESH_MS);

  // ── Actions ────────────────────────────────────────────────────────────────

  async function patchTask(taskId, body) {
    const res = await fetch(`${API_BASE}/api/admin/scheduled-tasks/${taskId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async function toggleEnabled(task) {
    try {
      const updated = await patchTask(task.id, { enabled: !task.enabled });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      showToast(`Task "${task.name}" ${updated.enabled ? 'enabled' : 'disabled'}`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function saveCron(taskId, cron) {
    const updated = await patchTask(taskId, { cron });
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    showToast('Schedule updated', 'success');
  }

  async function triggerNow(task) {
    setTriggering((p) => ({ ...p, [task.id]: true }));
    try {
      const res = await fetch(`${API_BASE}/api/admin/scheduled-tasks/${task.id}/run`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === task.id ? data.task : t)));
      showToast(`"${task.name}" executed successfully`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setTriggering((p) => ({ ...p, [task.id]: false }));
    }
  }

  // ── Filter / search ────────────────────────────────────────────────────────

  const categories = [...new Set(tasks.map((t) => t.category))].sort((a, b) => a - b);

  const filtered = tasks.filter((t) => {
    const matchCat = filter === 'all' || t.category === filter;
    const matchQ = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQ;
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      {/* Page header */}
      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Scheduled Tasks</h1>
          <p className="page-subtitle">Monitor, enable/disable, and trigger background jobs</p>
        </div>
        <button
          className="btn-secondary"
          onClick={() => load()}
          aria-label="Refresh tasks"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <AdminIcon name="RefreshCw" size={14} />
          Refresh
        </button>
      </div>

      {error && <div className="page-error">{error}</div>}

      {/* Stats */}
      {stats && (
        <div
          className="stats-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', marginBottom: 28 }}
        >
          <StatCard icon="List" label="Total Tasks" value={stats.totalTasks} />
          <StatCard icon="CheckCircle" label="Enabled" value={stats.enabledTasks} color="#22c55e" />
          <StatCard icon="XCircle" label="Disabled" value={stats.disabledTasks} color="#6b7280" />
          <StatCard icon="Loader" label="Running Now" value={stats.runningTasks} color="#f59e0b" />
          <StatCard icon="BarChart" label="Total Runs" value={stats.totalRuns} />
          <StatCard
            icon="AlertTriangle"
            label="Failures"
            value={stats.totalFails}
            color="#ef4444"
          />
          <StatCard
            icon="Percent"
            label="Success Rate"
            value={`${stats.successRate}%`}
            color="#22c55e"
          />
          <StatCard icon="Clock" label="Avg Duration" value={fmtDuration(stats.avgDurationMs)} />
        </div>
      )}

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 20,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          className="search-input"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text)',
            padding: '7px 12px',
            fontSize: 13,
            width: 220,
          }}
          placeholder="Search tasks…"
          value={searchQuery}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search tasks"
        />
        <div className="tabs" style={{ margin: 0 }}>
          <button
            className={`tab${filter === 'all' ? ' active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`tab${filter === cat ? ' active' : ''}`}
              onClick={() => setFilter(cat)}
              style={
                filter === cat
                  ? {
                      background: CATEGORY_COLORS[cat] || 'var(--red)',
                      borderColor: CATEGORY_COLORS[cat] || 'var(--red)',
                    }
                  : {}
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      {loading ? (
        <div className="list">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 72 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No tasks match your filter.</div>
      ) : (
        <div className="list">
          {filtered.map((task) => {
            const catColor = CATEGORY_COLORS[task.category] || '#6b7280';
            const isTriggering = triggering[task.id];
            return (
              <div
                key={task.id}
                className="list-item"
                style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}
              >
                {/* Top row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div className="list-item-left" style={{ flex: 1, minWidth: 0 }}>
                    <div className="item-icon" style={{ color: catColor }}>
                      <AdminIcon name="Clock" size={18} aria-hidden="true" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        className="item-name"
                        style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
                      >
                        {task.name}
                        {task.running && statusBadge('running')}
                        {!task.running && task.lastStatus && statusBadge(task.lastStatus)}
                        <span
                          style={{
                            fontSize: 10,
                            padding: '1px 7px',
                            borderRadius: 20,
                            background: catColor + '22',
                            color: catColor,
                            fontWeight: 600,
                          }}
                        >
                          {task.category}
                        </span>
                      </div>
                      <div className="item-meta">{task.description}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="list-item-right" style={{ flexShrink: 0 }}>
                    {/* Toggle enabled */}
                    <button
                      className={`btn-secondary`}
                      style={{
                        fontSize: 11,
                        padding: '4px 10px',
                        background: task.enabled ? 'rgba(34,197,94,0.08)' : 'transparent',
                        borderColor: task.enabled ? '#22c55e' : 'var(--border)',
                        color: task.enabled ? '#22c55e' : 'var(--text2)',
                      }}
                      onClick={() => toggleEnabled(task)}
                      title={task.enabled ? 'Click to disable' : 'Click to enable'}
                    >
                      {task.enabled ? 'Enabled' : 'Disabled'}
                    </button>

                    {/* Edit cron */}
                    <button
                      className="btn-icon"
                      title="Edit schedule"
                      onClick={() => setEditCron(task)}
                    >
                      <AdminIcon name="Edit" size={15} />
                    </button>

                    {/* Run now */}
                    <button
                      className="btn-icon"
                      title="Run now"
                      disabled={isTriggering || task.running}
                      onClick={() => triggerNow(task)}
                      style={{ color: 'var(--red)' }}
                    >
                      {isTriggering ? (
                        <AdminIcon name="Loader" size={15} />
                      ) : (
                        <AdminIcon name="Play" size={15} />
                      )}
                    </button>

                    {/* History */}
                    <button
                      className="btn-icon"
                      title="View history"
                      onClick={() => setHistoryTask(task.id)}
                    >
                      <AdminIcon name="List" size={15} />
                    </button>
                  </div>
                </div>

                {/* Bottom meta row */}
                <div
                  style={{
                    display: 'flex',
                    gap: 24,
                    flexWrap: 'wrap',
                    fontSize: 11,
                    color: 'var(--text2)',
                    paddingLeft: 34,
                  }}
                >
                  <span>
                    <strong>Cron:</strong>{' '}
                    <code
                      style={{
                        fontFamily: 'monospace',
                        background: 'var(--surface2)',
                        padding: '1px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {task.cron}
                    </code>
                  </span>
                  <span>
                    <strong>Next Run:</strong> {fmtDate(task.nextRun)}
                  </span>
                  <span>
                    <strong>Last Run:</strong> {fmtDate(task.lastRun)}
                  </span>
                  <span>
                    <strong>Last Duration:</strong> {fmtDuration(task.lastDurationMs)}
                  </span>
                  <span>
                    <strong>History:</strong> {task.historyCount} runs recorded
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {historyTask && <HistoryPanel taskId={historyTask} onClose={() => setHistoryTask(null)} />}
      {editCronTask && (
        <CronEditorModal task={editCronTask} onSave={saveCron} onClose={() => setEditCron(null)} />
      )}
    </div>
  );
}
