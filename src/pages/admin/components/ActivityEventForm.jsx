import { useState } from 'react';
import { api } from '../services/api';
import { AdminIcon } from './AdminIcon';

const empty = {
  name: '',
  date: '',
  tagline: '',
  description: '',
  status: 'completed',
  metadata: {
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
    // Kept for continuity with the existing "Outcome" section.
    result: '',
    participants: '',
  },
};

export function ActivityEventForm({ activityKey, onClose }) {
  const [form, setForm] = useState(empty);
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
      const splitList = (s) => String(s || '').split(/\r?\n|,/).map(v => v.trim()).filter(Boolean);
      const payload = {
        ...form,
        metadata: {
          ...form.metadata,
          judges: splitList(form.metadata.judges),
          topicsCovered: splitList(form.metadata.topicsCovered),
          highlights: splitList(form.metadata.highlights),
        },
      };
      await api.activityEvents.create(activityKey, payload);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg" style={{ maxWidth: 620, width: '95vw' }}>
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
              <input value={form.metadata.participants} onChange={e => setMeta('participants', e.target.value)} placeholder="e.g. 120" />
            </div>
          </div>
          <div className="form-row">
            <label>Tagline</label>
            <input value={form.tagline} onChange={e => set('tagline', e.target.value)} placeholder="Short one-liner" />
          </div>

          {/* Topic & Presenter */}
          <div className="form-section-label" style={{ marginTop: 8 }}>Session Info</div>
          <div className="form-row">
            <label>Event Topic</label>
            <input value={form.metadata.topic} onChange={e => setMeta('topic', e.target.value)} placeholder="e.g. Introduction to Generative AI" />
          </div>
          <div className="form-row-2col">
            <div className="form-row">
              <label>Presenter / Speaker</label>
              <input value={form.metadata.presenter.name} onChange={e => setMetaNested('presenter', 'name', e.target.value)} placeholder="e.g. Ayush Sharma" />
            </div>
            <div className="form-row">
              <label>Speaker Title / Designation</label>
              <input value={form.metadata.presenter.title} onChange={e => setMetaNested('presenter', 'title', e.target.value)} placeholder="e.g. Domain Lead" />
            </div>
          </div>
          <div className="form-row">
            <label>Jury / Judges</label>
            <input value={form.metadata.judges} onChange={e => setMeta('judges', e.target.value)} placeholder="Comma-separated (if applicable for competitions)" />
          </div>
          <div className="form-row-2col">
            <div className="form-row">
              <label>Faculty In-Charge</label>
              <input value={form.metadata.facultyInCharge.name} onChange={e => setMetaNested('facultyInCharge', 'name', e.target.value)} />
            </div>
            <div className="form-row">
              <label>Department</label>
              <input value={form.metadata.facultyInCharge.department} onChange={e => setMetaNested('facultyInCharge', 'department', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <label>Topics Covered</label>
            <textarea value={form.metadata.topicsCovered} onChange={e => setMeta('topicsCovered', e.target.value)} rows={2} placeholder="One per line, or comma-separated" />
          </div>
          <div className="form-row">
            <label>Overview</label>
            <textarea
              value={form.metadata.overview}
              onChange={e => setMeta('overview', e.target.value)}
              rows={3}
              placeholder="Brief overview of what was covered, key takeaways..."
            />
          </div>

          {/* Outcome */}
          <div className="form-section-label" style={{ marginTop: 8 }}>Outcome</div>
          <div className="form-row">
            <label>Result / Winner</label>
            <input value={form.metadata.result} onChange={e => setMeta('result', e.target.value)} placeholder="e.g. 1st: Team Alpha — 2nd: Team Nova" />
          </div>
          <div className="form-row">
            <label>Event Highlights</label>
            <textarea value={form.metadata.highlights} onChange={e => setMeta('highlights', e.target.value)} rows={2} placeholder="Key takeaways and outcomes, one per line" />
          </div>
          <div className="form-row">
            <label>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Additional notes or description..." />
          </div>

          {/* Media */}
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
          <div className="form-row-2col">
            <div className="form-row">
              <label>Time</label>
              <input value={form.metadata.time} onChange={e => setMeta('time', e.target.value)} placeholder="e.g. 4:00 PM – 6:00 PM" />
            </div>
            <div className="form-row">
              <label>Venue</label>
              <input value={form.metadata.venue} onChange={e => setMeta('venue', e.target.value)} />
            </div>
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
