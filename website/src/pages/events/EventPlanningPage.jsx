import { useState, useEffect, useCallback } from 'react';

// Validates a date value before formatting — avoids rendering literal
// "Invalid Date" text when the API returns a null or malformed timestamp.
function formatDate(value) {
  if (!value) return 'Unknown';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleDateString();
}
function formatDateTime(value) {
  if (!value) return 'Unknown';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleString();
}
import apiClient from '../../utils/apiClient';
import { getApiBase, buildUrl } from '../../utils/runtimeConfig';
import { initializeSocket, getSocket, joinRoom, leaveRoom } from '../../utils/socketClient';

const STATUSES = ['not_started', 'in_progress', 'done', 'blocked'];
const PRIORITIES = { low: '#6b7280', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' };

export default function EventPlanningPage({ event, onBack }) {
  const [plan, setPlan] = useState({
    tasks: [],
    comments: [],
    templates: [],
    budget: { total: 0, categories: {}, expenses: [] },
    activityLog: [],
  });
  const [loading, setLoading] = useState(true);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignee: '',
    deadline: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState(null);

  const eventId = event?.id || event?.eventId;

  const fetchPlan = useCallback(async () => {
    const base = getApiBase();
    const url = buildUrl(base, `/api/content/events/${eventId}/planning`);
    if (url) {
      try {
        const data = await apiClient(url);
        setPlan(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch event plan:', err);
        setError(err.message || 'Failed to load event plan. Please try again.');
      }
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  useEffect(() => {
    const socket = initializeSocket();
    if (!socket || !eventId) return;
    joinRoom(`planning:${eventId}`);

    const onUpdate = (data) => {
      if (data?.eventId === eventId) fetchPlan();
    };
    socket.on('planning:updated', onUpdate);
    return () => {
      socket.off('planning:updated', onUpdate);
      leaveRoom(`planning:${eventId}`);
    };
  }, [eventId, fetchPlan]);

  const emitUpdate = () => {
    const socket = getSocket();
    if (socket) socket.emit('planning:updated', { eventId });
  };

  const createTask = async () => {
    if (!taskForm.title.trim()) return;
    const base = getApiBase();
    const url = buildUrl(base, `/api/content/events/${eventId}/planning/tasks`);
    if (url) {
      try {
        await apiClient(url, {
          method: 'POST',
          body: JSON.stringify(taskForm),
          headers: { 'Content-Type': 'application/json' },
        });
        emitUpdate();
        await fetchPlan();
      } catch {}
    } else {
      setPlan((p) => ({
        ...p,
        tasks: [
          ...p.tasks,
          {
            id: `task-${Date.now()}`,
            ...taskForm,
            status: 'not_started',
            createdAt: new Date().toISOString(),
          },
        ],
      }));
    }
    setTaskForm({ title: '', description: '', priority: 'medium', assignee: '', deadline: '' });
    setShowForm(false);
  };

  const updateStatus = async (taskId, status) => {
    const base = getApiBase();
    const url = buildUrl(base, `/api/content/events/${eventId}/planning/tasks/${taskId}`);
    if (url) {
      try {
        await apiClient(url, {
          method: 'PUT',
          body: JSON.stringify({ status }),
          headers: { 'Content-Type': 'application/json' },
        });
      } catch {}
    }
    setPlan((p) => ({ ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)) }));
    emitUpdate();
  };

  const addComment = async () => {
    if (!commentText.trim() || !selectedTask) return;
    const base = getApiBase();
    const url = buildUrl(
      base,
      `/api/content/events/${eventId}/planning/tasks/${selectedTask}/comments`
    );
    if (url) {
      try {
        await apiClient(url, {
          method: 'POST',
          body: JSON.stringify({ content: commentText }),
          headers: { 'Content-Type': 'application/json' },
        });
        emitUpdate();
        await fetchPlan();
      } catch {}
    }
    setCommentText('');
  };

  const tasksByStatus = {};
  STATUSES.forEach((s) => {
    tasksByStatus[s] = plan.tasks.filter((t) => t.status === s);
  });

  if (loading)
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Loading event plan...</p>
      </div>
    );

  if (error)
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--danger, red)' }}>
        <p style={{ marginBottom: 16 }}>{error}</p>
        <button onClick={fetchPlan} className="btn-primary">
          Retry
        </button>
      </div>
    );

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--t2)',
                cursor: 'pointer',
                fontSize: 14,
                marginBottom: 8,
              }}
            >
              &larr; Back to event
            </button>
          )}
          <h1 style={{ margin: 0 }}>Event Planning — {event?.name || eventId}</h1>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Task'}
        </button>
      </div>

      {showForm && (
        <div
          style={{
            background: 'var(--bg2)',
            padding: 20,
            borderRadius: 12,
            marginBottom: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <input
            placeholder="Task title"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            style={inputStyle}
            autoFocus
          />
          <textarea
            placeholder="Description"
            value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <select
              value={taskForm.priority}
              onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
              style={inputStyle}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <input
              placeholder="Assignee"
              value={taskForm.assignee}
              onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })}
              style={inputStyle}
            />
            <input
              type="date"
              value={taskForm.deadline}
              onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
              style={inputStyle}
            />
          </div>
          <button className="btn-primary" onClick={createTask}>
            Create Task
          </button>
        </div>
      )}

      <div
        className="kanban-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {STATUSES.map((status) => (
          <div
            key={status}
            style={{ background: 'var(--bg2)', borderRadius: 12, padding: 16, minHeight: 200 }}
          >
            <h3
              style={{
                margin: '0 0 12px',
                textTransform: 'capitalize',
                fontSize: 14,
                color: 'var(--t2)',
              }}
            >
              {status.replace('_', ' ')} ({tasksByStatus[status].length})
            </h3>
            {tasksByStatus[status].map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(selectedTask === task.id ? null : task.id)}
                style={{
                  background: 'var(--bg1)',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                  cursor: 'pointer',
                  borderLeft: `3px solid ${PRIORITIES[task.priority] || '#6b7280'}`,
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{task.title}</div>
                {task.assignee && (
                  <div style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 4 }}>
                    @{task.assignee}
                  </div>
                )}
                {task.deadline && (
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>
                    Due: {formatDate(task.deadline)}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                  {status !== 'not_started' && (
                    <button
                      className="btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus(task.id, 'not_started');
                      }}
                    >
                      Todo
                    </button>
                  )}
                  {status !== 'in_progress' && (
                    <button
                      className="btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus(task.id, 'in_progress');
                      }}
                    >
                      In Prog
                    </button>
                  )}
                  {status !== 'done' && (
                    <button
                      className="btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus(task.id, 'done');
                      }}
                    >
                      Done
                    </button>
                  )}
                  {status !== 'blocked' && (
                    <button
                      className="btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus(task.id, 'blocked');
                      }}
                    >
                      Blocked
                    </button>
                  )}
                </div>
              </div>
            ))}
            {tasksByStatus[status].length === 0 && (
              <div style={{ color: 'var(--t3)', fontSize: 12, textAlign: 'center', padding: 24 }}>
                No tasks
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div>
          {selectedTask &&
            (() => {
              const task = plan.tasks.find((t) => t.id === selectedTask);
              const taskComments = plan.comments.find((c) => c.taskId === selectedTask);
              if (!task) return null;
              return (
                <div style={{ background: 'var(--bg2)', borderRadius: 12, padding: 20 }}>
                  <h3>{task.title}</h3>
                  {task.description && (
                    <p style={{ color: 'var(--t2)', fontSize: 14 }}>{task.description}</p>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      gap: 16,
                      fontSize: 12,
                      color: 'var(--t3)',
                      margin: '12 0',
                    }}
                  >
                    <span>
                      Priority:{' '}
                      <strong style={{ color: PRIORITIES[task.priority] }}>{task.priority}</strong>
                    </span>
                    {task.assignee && (
                      <span>
                        Assignee: <strong>@{task.assignee}</strong>
                      </span>
                    )}
                    {task.deadline && (
                      <span>
                        Deadline: <strong>{formatDate(task.deadline)}</strong>
                      </span>
                    )}
                  </div>
                  <h4 style={{ margin: '16 0 8', fontSize: 14 }}>Comments</h4>
                  <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
                    {(taskComments?.comments || []).map((c) => (
                      <div
                        key={c.id}
                        style={{
                          padding: '8 0',
                          borderBottom: '1px solid var(--border)',
                          fontSize: 13,
                        }}
                      >
                        <strong>{c.author || 'Anonymous'}</strong>: {c.content}
                        <div style={{ fontSize: 11, color: 'var(--t3)' }}>
                          {formatDateTime(c.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      style={{ flex: 1, ...inputStyle }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addComment();
                      }}
                    />
                    <button className="btn-primary btn-sm" onClick={addComment}>
                      Send
                    </button>
                  </div>
                </div>
              );
            })()}
        </div>

        <div>
          <div
            style={{ background: 'var(--bg2)', borderRadius: 12, padding: 20, marginBottom: 16 }}
          >
            <h3 style={{ margin: '0 0 12', fontSize: 14 }}>Budget</h3>
            <div style={{ fontSize: 13, color: 'var(--t2)' }}>
              <div>
                Total: <strong>${plan.budget.total}</strong>
              </div>
              <div style={{ marginTop: 8 }}>
                Expenses:{' '}
                <strong>
                  ${plan.budget.expenses.reduce((s, e) => s + Number(e.amount || 0), 0)}
                </strong>
              </div>
              <div style={{ marginTop: 4 }}>
                Remaining:{' '}
                <strong>
                  $
                  {plan.budget.total -
                    plan.budget.expenses.reduce((s, e) => s + Number(e.amount || 0), 0)}
                </strong>
              </div>
            </div>
            {plan.budget.expenses.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <h4 style={{ fontSize: 12, margin: '0 0 8', color: 'var(--t3)' }}>
                  Recent Expenses
                </h4>
                {plan.budget.expenses
                  .slice(-5)
                  .reverse()
                  .map((e) => (
                    <div
                      key={e.id}
                      style={{
                        fontSize: 12,
                        padding: '4 0',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {e.description} — <strong>${e.amount}</strong>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div style={{ background: 'var(--bg2)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 12', fontSize: 14 }}>Activity Log</h3>
            <div style={{ maxHeight: 200, overflowY: 'auto', fontSize: 12 }}>
              {plan.activityLog
                .slice()
                .reverse()
                .slice(0, 20)
                .map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: '6 0',
                      borderBottom: '1px solid var(--border)',
                      color: 'var(--t2)',
                    }}
                  >
                    <strong>{log.user}</strong> {log.details}
                    <div style={{ color: 'var(--t3)', fontSize: 11 }}>
                      {formatDateTime(log.timestamp)}
                    </div>
                  </div>
                ))}
              {plan.activityLog.length === 0 && (
                <div style={{ color: 'var(--t3)', textAlign: 'center', padding: 16 }}>
                  No activity yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '8 12',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--bg1)',
  color: 'var(--t1)',
  fontSize: 13,
  outline: 'none',
};
