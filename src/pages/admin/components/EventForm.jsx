import { useState } from 'react';
import { api } from '../services/api';
import { AdminIcon } from './AdminIcon';

const STATUSES = ['upcoming', 'completed'];

const ACTIVITY_CATEGORIES = [
  'Hackathon', 'Codathon', 'Ideathon', 'Promptathon',
  'Workshop', 'Insight Session', 'Open Source Day', 'Tech Debate',
];

const emptyMetadata = {
  category: '',
  topic: '',
  overview: '',
  presenter: { name: '', title: '' },
  judges: '',
  topicsCovered: '',
  highlights: '',
  facultyInCharge: { name: '', department: '' },
  photosLink: '',
  videosLink: '',
  time: '',
  venue: '',
};

const empty = {
  name: '',
  shortName: '',
  date: '',
  description: '',
  icon: 'Calendar',
  status: 'upcoming',
  tags: '',
  metadata: emptyMetadata,
};

// Normalizes an event coming back from the API (arrays/objects) into the
// comma/newline-separated strings this form edits.
function toFormState(event) {
  if (!event) return empty;
  const md = event.metadata || {};
  return {
    ...empty,
    ...event,
    tags: Array.isArray(event.tags) ? event.tags.join(', ') : (event.tags || ''),
    metadata: {
      ...emptyMetadata,
      ...md,
      presenter: { ...emptyMetadata.presenter, ...(md.presenter || {}) },
      facultyInCharge: { ...emptyMetadata.facultyInCharge, ...(md.facultyInCharge || {}) },
      judges: Array.isArray(md.judges) ? md.judges.join(', ') : (md.judges || ''),
      topicsCovered: Array.isArray(md.topicsCovered) ? md.topicsCovered.join('\n') : (md.topicsCovered || ''),
      highlights: Array.isArray(md.highlights) ? md.highlights.join('\n') : (md.highlights || ''),
    },
  };
}

// Converts the form's comma/newline strings back into arrays for the API.
function toPayload(form) {
  const splitList = (s) => String(s || '').split(/\r?\n|,/).map(v => v.trim()).filter(Boolean);
  return {
    ...form,
    tags: splitList(form.tags),
    metadata: {
      ...form.metadata,
      judges: splitList(form.metadata.judges),
      topicsCovered: splitList(form.metadata.topicsCovered),
      highlights: splitList(form.metadata.highlights),
    },
  };
}

export function EventForm({ event, onClose }) {
  const [form, setForm] = useState(toFormState(event));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setMeta = (k, v) => setForm(f => ({ ...f, metadata: { ...f.metadata, [k]: v } }));
  const setMetaNested = (group, k, v) =>
    setForm(f => ({ ...f, metadata: { ...f.metadata, [group]: { ...f.metadata[group], [k]: v } } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = toPayload(form);
      if (event?.id) {
        await api.events.update(event.id, payload);
      } else {
        await api.events.create(payload);
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
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3>{event?.id ? 'Edit Event' : 'New Event'}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close"><AdminIcon name="X" size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-section-label">Basics</div>
          <div className="form-row">
            <label>Activity Category</label>
            <select value={form.metadata.category} onChange={e => setMeta('category', e.target.value)}>
              <option value="">— Select category —</option>
              {ACTIVITY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label>Event Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>
          <div className="form-row">
            <label>Short Name</label>
            <input value={form.shortName} onChange={e => set('shortName', e.target.value)} placeholder="Shown in compact lists" />
          </div>
          <div className="form-row">
            <label>Event Topic / Title</label>
            <input value={form.metadata.topic} onChange={e => setMeta('topic', e.target.value)} placeholder="e.g. Building with RAG pipelines" />
          </div>
          <div className="form-row">
            <label>Overview / Summary</label>
            <textarea value={form.metadata.overview} onChange={e => setMeta('overview', e.target.value)} rows={3} />
          </div>

          <div className="form-section-label" style={{ marginTop: 8 }}>People</div>
          <div className="form-row-2col">
            <div className="form-row">
              <label>Presenter / Guest Speaker</label>
              <input value={form.metadata.presenter.name} onChange={e => setMetaNested('presenter', 'name', e.target.value)} placeholder="Name" />
            </div>
            <div className="form-row">
              <label>Speaker Title / Designation</label>
              <input value={form.metadata.presenter.title} onChange={e => setMetaNested('presenter', 'title', e.target.value)} placeholder="e.g. Senior SDE, Google" />
            </div>
          </div>
          <div className="form-row">
            <label>Jury / Judges</label>
            <input value={form.metadata.judges} onChange={e => setMeta('judges', e.target.value)} placeholder="Comma-separated, e.g. Jane Doe, John Smith" />
          </div>
          <div className="form-row-2col">
            <div className="form-row">
              <label>Faculty In-Charge</label>
              <input value={form.metadata.facultyInCharge.name} onChange={e => setMetaNested('facultyInCharge', 'name', e.target.value)} placeholder="Name" />
            </div>
            <div className="form-row">
              <label>Department</label>
              <input value={form.metadata.facultyInCharge.department} onChange={e => setMetaNested('facultyInCharge', 'department', e.target.value)} />
            </div>
          </div>

          <div className="form-section-label" style={{ marginTop: 8 }}>Content</div>
          <div className="form-row">
            <label>Topics Covered</label>
            <textarea value={form.metadata.topicsCovered} onChange={e => setMeta('topicsCovered', e.target.value)} rows={3} placeholder="One per line, or comma-separated" />
          </div>
          <div className="form-row">
            <label>Event Highlights</label>
            <textarea value={form.metadata.highlights} onChange={e => setMeta('highlights', e.target.value)} rows={3} placeholder="Key takeaways and outcomes, one per line" />
          </div>
          <div className="form-row">
            <label>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} />
          </div>
          <div className="form-row">
            <label>Tags</label>
            <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="Comma-separated, e.g. AI, Learning" />
          </div>

          <div className="form-section-label" style={{ marginTop: 8 }}>Media</div>
          <div className="form-row-2col">
            <div className="form-row">
              <label>Photos Drive Link</label>
              <input type="url" value={form.metadata.photosLink} onChange={e => setMeta('photosLink', e.target.value)} placeholder="https://drive.google.com/..." />
            </div>
            <div className="form-row">
              <label>Videos Drive Link</label>
              <input type="url" value={form.metadata.videosLink} onChange={e => setMeta('videosLink', e.target.value)} placeholder="https://drive.google.com/..." />
            </div>
          </div>

          <div className="form-section-label" style={{ marginTop: 8 }}>Schedule & Status</div>
          <div className="form-row-2col">
            <div className="form-row">
              <label>Date</label>
              <input value={form.date} onChange={e => set('date', e.target.value)} placeholder="e.g. March 15, 2025" />
            </div>
            <div className="form-row">
              <label>Time</label>
              <input value={form.metadata.time} onChange={e => setMeta('time', e.target.value)} placeholder="e.g. 4:00 PM – 6:00 PM" />
            </div>
          </div>
          <div className="form-row">
            <label>Venue</label>
            <input value={form.metadata.venue} onChange={e => setMeta('venue', e.target.value)} />
          </div>
          <div className="form-row">
            <label>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label>Icon</label>
            <input value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="Icon name, e.g. Brain or Calendar" />
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
