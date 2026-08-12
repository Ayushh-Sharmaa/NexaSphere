import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useEventListener } from '../hooks/useEventListener';
import { EVENTS } from '../services/eventEmitter';
import { ActivityEventForm } from '../components/ActivityEventForm';
import { Skeleton } from '../components/Skeleton';
import { AdminIcon } from '../components/AdminIcon';

const ACTIVITIES = [
  { key: 'hackathon', name: 'Hackathon' },
  { key: 'codathon', name: 'Codathon' },
  { key: 'ideathon', name: 'Ideathon' },
  { key: 'promptathon', name: 'Promptathon' },
  { key: 'workshop', name: 'Workshop' },
  { key: 'insight-session', name: 'Insight Session' },
  { key: 'open-source-day', name: 'Open Source Day' },
  { key: 'tech-debate', name: 'Tech Debate' },
];

export function ActivityEventsManager() {
  const [selected, setSelected] = useState(ACTIVITIES[0].key);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [error, setError] = useState('');

  const loadEvents = useCallback(async (key) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.activityEvents.getAll(key);
      setEvents(data?.events ?? []);
    } catch (e) {
      setEvents([]);
      setError(e.message || 'Failed to load activity events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents(selected);
  }, [selected, loadEvents]);

  useEventListener(
    EVENTS.ACTIVITY_EVENT_CREATED,
    useCallback(
      ({ activityKey, event }) => {
        if (activityKey === selected) setEvents((prev) => [event, ...prev]);
        setShowForm(false);
      },
      [selected]
    )
  );

  useEventListener(
    EVENTS.ACTIVITY_EVENT_DELETED,
    useCallback(
      ({ activityKey, eventId }) => {
        if (activityKey === selected) setEvents((prev) => prev.filter((e) => e.id !== eventId));
      },
      [selected]
    )
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const eventId = deleteTarget.id;
    setDeleting(eventId);
    setDeleteError('');
    try {
      await api.activityEvents.delete(selected, eventId);
      setDeleteTarget(null);
    } catch {
      setDeleteError('Failed to delete activity event. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const selectedName = ACTIVITIES.find((a) => a.key === selected)?.name;

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Activity Events</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Add to {selectedName}
        </button>
      </div>

      <div className="tabs">
        {ACTIVITIES.map((a) => (
          <button
            key={a.key}
            className={`tab${selected === a.key ? ' active' : ''}`}
            onClick={() => setSelected(a.key)}
          >
            {a.name}
          </button>
        ))}
      </div>

      {showForm && <ActivityEventForm activityKey={selected} onClose={() => setShowForm(false)} />}

      {loading && <Skeleton height={64} count={3} />}

      {error && <div className="page-error">{error}</div>}

      {!loading && !error && (
        <div className="list">
          {events.length === 0 && (
            <div className="empty-state">No events for {selectedName} yet.</div>
          )}
          {events.map((event) => (
            <div key={event.id} className="list-item">
              <div className="list-item-left">
                <div>
                  <div className="item-name">{event.name}</div>
                  <div className="item-meta">
                    {event.date && `${event.date}`}
                    {event.participants && ` · ${event.participants} participants`}
                  </div>
                </div>
              </div>
              <div className="list-item-right">
                <button
                  className="btn-icon danger"
                  onClick={() => {
                    setDeleteTarget(event);
                    setDeleteError('');
                  }}
                  disabled={deleting === event.id}
                  aria-label="Delete activity event"
                >
                  {deleting === event.id ? '...' : <AdminIcon name="Trash" size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-activity-event-title"
        >
          <div className="modal">
            <div className="modal-header">
              <h3 id="delete-activity-event-title">Delete Activity Event</h3>
              <button
                className="modal-close"
                onClick={() => setDeleteTarget(null)}
                aria-label="Close"
              >
                <AdminIcon name="X" size={16} />
              </button>
            </div>
            <p className="page-subtitle" style={{ marginBottom: 16 }}>
              This will remove "{deleteTarget.name}" from {selectedName}.
            </p>
            {deleteError && <div className="page-error">{deleteError}</div>}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                marginTop: 20,
              }}
            >
              <button
                className="btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting === deleteTarget.id}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleDelete}
                disabled={deleting === deleteTarget.id}
              >
                {deleting === deleteTarget.id ? 'Deleting...' : 'Delete Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
