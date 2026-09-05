import { useState } from 'react';
import { api } from '../services/api';
import { AdminIcon } from './AdminIcon';

const STATUSES = ['upcoming', 'ongoing', 'completed', 'cancelled'];

const empty = { name: '', dateText: '', description: '', icon: 'Calendar', status: 'upcoming', location: '', registrationLink: '' };

export function EventForm({ event, onClose }) {
  const [form, setForm] = useState(event ? { ...event } : empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (event?.id) {
        await api.events.update(event.id, form);
      } else {
        await api.events.create(form);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{event?.id ? 'Edit Event' : 'New Event'}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close"><AdminIcon name="X" size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-row">
            <label>Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>
          <div className="form-row">
            <label>Date</label>
            <input value={form.dateText} onChange={e => set('dateText', e.target.value)} placeholder="e.g. March 15, 2025" />
          </div>
          <div className="form-row">
            <label>Icon</label>
            <input value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="Icon name, e.g. Brain or Calendar" />
          </div>
          <div className="form-row">
            <label>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label>Location</label>
            <input value={form.location} onChange={e => set('location', e.target.value)} />
          </div>
          <div className="form-row">
            <label>Registration Link</label>
            <input value={form.registrationLink} onChange={e => set('registrationLink', e.target.value)} type="url" />
          </div>
          <div className="form-row">
            <label>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} />
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
