import { useState } from 'react';
import { api } from '../services/api';
import { AdminIcon } from './AdminIcon';

const empty = {
  name: '',
  date: '',
  description: '',
  participants: '',
  result: '',
  topic: '',
  overview: '',
  presenter: '',
};

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
      <div className="modal" style={{ maxWidth: 540, width: '95vw' }}>
        <div className="modal-header">
          <h3>Add Activity Event</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close"><AdminIcon name="X" size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="form">
          {/* Core Info */}
          <div className="form-section-label">Event Details</div>
          <div className="form-row">
            <label>Event Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. KSS #154 — Cloud Computing" />
          </div>
          <div className="form-row-2col">
            <div className="form-row">
              <label>Date</label>
              <input value={form.date} onChange={e => set('date', e.target.value)} type="date" />
            </div>
            <div className="form-row">
              <label>Participants</label>
              <input value={form.participants} onChange={e => set('participants', e.target.value)} placeholder="e.g. 120" />
            </div>
          </div>

          {/* Topic & Presenter */}
          <div className="form-section-label" style={{ marginTop: 8 }}>Session Info</div>
          <div className="form-row">
            <label>Event Topic</label>
            <input value={form.topic} onChange={e => set('topic', e.target.value)} placeholder="e.g. Introduction to Generative AI" />
          </div>
          <div className="form-row">
            <label>Presenter / Speaker</label>
            <input value={form.presenter} onChange={e => set('presenter', e.target.value)} placeholder="e.g. Ayush Sharma, Domain Lead" />
          </div>
          <div className="form-row">
            <label>Overview</label>
            <textarea
              value={form.overview}
              onChange={e => set('overview', e.target.value)}
              rows={3}
              placeholder="Brief overview of what was covered, key takeaways..."
            />
          </div>

          {/* Outcome */}
          <div className="form-section-label" style={{ marginTop: 8 }}>Outcome</div>
          <div className="form-row">
            <label>Result / Winner</label>
            <input value={form.result} onChange={e => set('result', e.target.value)} placeholder="e.g. 1st: Team Alpha — 2nd: Team Nova" />
          </div>
          <div className="form-row">
            <label>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Additional notes or description..." />
          </div>

          {error && <div className="form-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
