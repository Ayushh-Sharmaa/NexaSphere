import { useState } from 'react';
import { api } from '../services/api';
import { AdminIcon } from './AdminIcon';

const STATUSES = ['upcoming', 'completed'];
const CATEGORIES = ['Hackathon', 'Codathon', 'Ideathon', 'Promptathon', 'Workshop', 'Insight Session', 'Open Source Day', 'Tech Debate'];
const ICONS = ['Brain', 'Wrench', 'Trophy', 'Terminal', 'Lightbulb', 'Sparkles', 'GitBranch', 'MessageSquare'];

const empty = { name: '', dateText: '', time: '', venue: '', category: 'Workshop', description: '', speakerName: '', speakerTitle: '', judges: '', topicsCovered: '', highlights: '', facultyInCharge: '', mediaDriveLink: '', icon: 'Wrench', status: 'upcoming', registrationLink: '' };

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
            <label>Event topic / title *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>
          <div className="form-row">
            <label>Activity category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(category => <option key={category}>{category}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label>Date *</label>
            <input value={form.dateText || form.date || ''} onChange={e => set('dateText', e.target.value)} placeholder="e.g. March 15, 2026" required />
          </div>
          <div className="form-row"><label>Time</label><input value={form.time || ''} onChange={e => set('time', e.target.value)} placeholder="e.g. 11:00 AM – 1:00 PM" /></div>
          <div className="form-row"><label>Venue</label><input value={form.venue || form.location || ''} onChange={e => set('venue', e.target.value)} placeholder="Auditorium / Lab" /></div>
          <div className="form-row">
            <label>SVG icon</label>
            <select value={form.icon} onChange={e => set('icon', e.target.value)}>{ICONS.map(icon => <option key={icon}>{icon}</option>)}</select>
          </div>
          <div className="form-row">
            <label>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-row"><label>Presenter / guest speaker</label><input value={form.speakerName || ''} onChange={e => set('speakerName', e.target.value)} /></div>
          <div className="form-row"><label>Speaker designation</label><input value={form.speakerTitle || ''} onChange={e => set('speakerTitle', e.target.value)} /></div>
          <div className="form-row"><label>Jury / judges</label><input value={form.judges || ''} onChange={e => set('judges', e.target.value)} placeholder="Comma-separated names" /></div>
          <div className="form-row"><label>Faculty in-charge</label><input value={form.facultyInCharge || ''} onChange={e => set('facultyInCharge', e.target.value)} /></div>
          <div className="form-row"><label>Photos & videos drive link</label><input type="url" value={form.mediaDriveLink || ''} onChange={e => set('mediaDriveLink', e.target.value)} /></div>
          <div className="form-row">
            <label>Registration Link</label>
            <input value={form.registrationLink} onChange={e => set('registrationLink', e.target.value)} type="url" />
          </div>
          <div className="form-row"><label>Overview / summary *</label><textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} required /></div>
          <div className="form-row"><label>Topics covered</label><textarea value={form.topicsCovered || ''} onChange={e => set('topicsCovered', e.target.value)} rows={2} placeholder="Comma-separated curriculum or discussion points" /></div>
          <div className="form-row"><label>Event highlights</label><textarea value={form.highlights || ''} onChange={e => set('highlights', e.target.value)} rows={2} /></div>
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
