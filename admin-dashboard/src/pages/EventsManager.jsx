import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { useEvents } from '../hooks/useEvents';
import { useEventListener } from '../hooks/useEventListener';
import { EVENTS } from '../services/eventEmitter';
import { EventForm } from '../components/EventForm';
import { Skeleton } from '../components/Skeleton';
import { AdminIcon } from '../components/AdminIcon';

const STATUS_COLORS = { upcoming: '#3b82f6', ongoing: '#22c55e', completed: '#6b7280', cancelled: '#ef4444' };

export function EventsManager() {
  const { events, setEvents, loading, error } = useEvents();
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEventListener(EVENTS.EVENT_CREATED, useCallback((e) => {
    setEvents(prev => [e, ...prev]);
    setShowForm(false);
  }, [setEvents]));

  useEventListener(EVENTS.EVENT_UPDATED, useCallback((e) => {
    setEvents(prev => prev.map(x => x.id === e.id ? e : x));
    setEditingEvent(null);
    setShowForm(false);
  }, [setEvents]));

  useEventListener(EVENTS.EVENT_DELETED, useCallback(({ id }) => {
    setEvents(prev => prev.filter(x => x.id !== id));
  }, [setEvents]));

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return;
    setDeleting(id);
    try {
      await api.events.delete(id);
    } catch {
      alert('Failed to delete event');
    } finally {
      setDeleting(null);
    }
  };

  const openEdit = (event) => { setEditingEvent(event); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingEvent(null); };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Events</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Event</button>
      </div>

      {(showForm || editingEvent) && (
        <EventForm event={editingEvent} onClose={closeForm} />
      )}

      {loading && <Skeleton height={72} count={4} />}
      {error && <div className="page-error">Failed to load events: {error}</div>}

      {!loading && !error && (
        <div className="list">
          {events.length === 0 && <div className="empty-state">No events yet. Add one!</div>}
          {events.map(event => (
            <div key={event.id} className="list-item">
              <div className="list-item-left">
                <span className="item-icon"><AdminIcon name={event.icon || 'Calendar'} size={22} /></span>
                <div>
                  <div className="item-name">{event.name}</div>
                  <div className="item-meta">{event.dateText} {event.location && `· ${event.location}`}</div>
                </div>
              </div>
              <div className="list-item-right">
                <span className="status-badge" style={{ background: STATUS_COLORS[event.status] || '#6b7280' }}>
                  {event.status}
                </span>
                <button className="btn-icon" onClick={() => openEdit(event)} aria-label="Edit event"><AdminIcon name="Pencil" size={16} /></button>
                <button
                  className="btn-icon danger"
                  onClick={() => handleDelete(event.id)}
                  disabled={deleting === event.id}
                  aria-label="Delete event"
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
