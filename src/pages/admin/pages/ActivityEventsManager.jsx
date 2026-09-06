import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useEventListener } from '../hooks/useEventListener';
import { EVENTS } from '../services/eventEmitter';
import { ActivityEventForm } from '../components/ActivityEventForm';
import { Skeleton } from '../components/Skeleton';
import { AdminIcon } from '../components/AdminIcon';

const ACTIVITIES = [
  { key: 'Hackathon', name: 'Hackathon' },
  { key: 'Codathon', name: 'Codathon' },
  { key: 'Ideathon', name: 'Ideathon' },
  { key: 'Promptathon', name: 'Promptathon' },
  { key: 'Workshop', name: 'Workshop' },
  { key: 'Insight Session', name: 'Insight Session' },
  { key: 'Open Source Day', name: 'Open Source Day' },
  { key: 'Tech Debate', name: 'Tech Debate' },
];

export function ActivityEventsManager() {
  const [selected, setSelected] = useState(ACTIVITIES[0].key);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const loadEvents = useCallback(async (key) => {
    setLoading(true);
    try {
      const data = await api.activityEvents.getAll(key);
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEvents(selected); }, [selected, loadEvents]);

  useEventListener(EVENTS.ACTIVITY_EVENT_CREATED, useCallback(({ activityKey, event }) => {
    if (activityKey === selected) setEvents(prev => [event, ...prev]);
    setShowForm(false);
  }, [selected]));

  useEventListener(EVENTS.ACTIVITY_EVENT_DELETED, useCallback(({ activityKey, eventId }) => {
    if (activityKey === selected) setEvents(prev => prev.filter(e => e.id !== eventId));
  }, [selected]));

  const handleDelete = async (eventId) => {
    if (!confirm('Delete this activity event?')) return;
    setDeleting(eventId);
    try {
      await api.activityEvents.delete(selected, eventId);
    } catch {
      alert('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const selectedName = ACTIVITIES.find(a => a.key === selected)?.name;

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Activity Events</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add to {selectedName}</button>
      </div>

      <div className="tabs">
        {ACTIVITIES.map(a => (
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

      {!loading && (
        <div className="list">
          {events.length === 0 && <div className="empty-state">No events for {selectedName} yet.</div>}
          {events.map(event => (
            <div key={event.id} className="list-item">
              <div className="list-item-left">
                <div>
                  <div className="item-name">{event.name}</div>
                  {event.metadata?.topic && (
                    <div className="item-meta" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AdminIcon name="BookOpen" size={12} /> {event.metadata.topic}
                    </div>
                  )}
                  {event.metadata?.presenter?.name && (
                    <div className="item-meta" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AdminIcon name="Mic" size={12} /> {event.metadata.presenter.name}
                      {event.metadata.presenter.title && ` — ${event.metadata.presenter.title}`}
                    </div>
                  )}
                  <div className="item-meta">
                    {event.date && `${event.date}`}
                    {event.metadata?.participants && ` · ${event.metadata.participants} participants`}
                    {event.metadata?.result && ` · ${event.metadata.result}`}
                    {event.metadata?.venue && ` · ${event.metadata.venue}`}
                  </div>
                  {event.metadata?.judges?.length > 0 && (
                    <div className="item-meta" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AdminIcon name="Award" size={12} /> Judges: {event.metadata.judges.join(', ')}
                    </div>
                  )}
                  {event.metadata?.facultyInCharge?.name && (
                    <div className="item-meta" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AdminIcon name="GraduationCap" size={12} /> {event.metadata.facultyInCharge.name}
                      {event.metadata.facultyInCharge.department && ` (${event.metadata.facultyInCharge.department})`}
                    </div>
                  )}
                  {event.metadata?.overview && (
                    <div className="item-meta" style={{ marginTop: 4, fontStyle: 'italic', maxWidth: 500 }}>
                      {event.metadata.overview.length > 120 ? event.metadata.overview.slice(0, 120) + '...' : event.metadata.overview}
                    </div>
                  )}
                  {(event.metadata?.photosLink || event.metadata?.videosLink) && (
                    <div className="item-meta" style={{ display: 'flex', gap: 12 }}>
                      {event.metadata.photosLink && (
                        <a href={event.metadata.photosLink} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <AdminIcon name="Camera" size={12} /> Photos
                        </a>
                      )}
                      {event.metadata.videosLink && (
                        <a href={event.metadata.videosLink} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <AdminIcon name="Video" size={12} /> Videos
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="list-item-right">
                <button
                  className="btn-icon danger"
                  onClick={() => handleDelete(event.id)}
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
    </div>
  );
}
