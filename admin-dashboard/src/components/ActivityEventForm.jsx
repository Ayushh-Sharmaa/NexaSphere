import { useState } from 'react';
import { api } from '../services/api';
import { AdminIcon } from './AdminIcon';

const empty = { name: '', date: '', description: '', participants: '', result: '' };

export function ActivityEventForm({ activityKey, onClose }) {
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.activityEvents.create(activityKey, form);
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
          <h3>Add Activity Event</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close"><AdminIcon name="X" size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-row">
            <label>Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>
          <div className="form-row">
            <label>Date</label>
            <input value={form.date} onChange={e => set('date', e.target.value)} type="date" />
          </div>
          <div className="form-row">
            <label>Participants</label>
            <input value={form.participants} onChange={e => set('participants', e.target.value)} placeholder="e.g. 120" />
          </div>
          <div className="form-row">
            <label>Result / Winner</label>
            <input value={form.result} onChange={e => set('result', e.target.value)} />
          </div>
          <div className="form-row">
            <label>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} />
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
