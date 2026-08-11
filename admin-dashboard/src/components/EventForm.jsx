import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { AdminIcon } from './AdminIcon';
import { useFocusTrap } from '../hooks/useFocusTrap';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const STATUSES = ['upcoming', 'ongoing', 'completed', 'cancelled'];

const CATEGORIES = [
  { value: '', label: 'Select category...' },
  { value: 'kss', label: 'Knowledge Sharing Session' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'debate', label: 'Tech Debate' },
  { value: 'opensource', label: 'Open Source Day' },
  { value: 'codathon', label: 'Codathon' },
  { value: 'ideathon', label: 'Ideathon' },
  { value: 'promptathon', label: 'Promptathon' },
  { value: 'insight-session', label: 'Insight Session' },
];

const ICON_OPTIONS = [
  'Brain',
  'Wrench',
  'Code',
  'MessageSquare',
  'Terminal',
  'GitBranch',
  'Rocket',
  'Sparkles',
  'Calendar',
  'Target',
  'Lightbulb',
  'Globe',
];

function toDisplayDate(isoVal) {
  if (!isoVal) return '';
  const d = new Date(isoVal + 'T00:00:00');
  if (isNaN(d)) return isoVal;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function toISODate(displayVal) {
  if (!displayVal) return '';
  const d = new Date(displayVal);
  if (isNaN(d)) return '';
  return d.toISOString().split('T')[0];
}

const empty = {
  name: '',
  shortName: '',
  dateText: '',
  dateISO: '',
  description: '',
  icon: 'Calendar',
  status: 'upcoming',
  category: '',
  location: '',
  capacity: '',
  hasDetailPage: true,
  tagsInput: '',
  gradientColors: [],
  restrictedGroupsInput: '',
};

export function EventForm({ event, onClose }) {
  const handleClose = useCallback(() => onClose(), [onClose]);
  const modalRef = useFocusTrap(true, handleClose);
  const [form, setForm] = useState(
    event
      ? {
          ...event,
          tagsInput: Array.isArray(event.tags) ? event.tags.join(', ') : event.tags || '',
          restrictedGroupsInput: Array.isArray(event.restrictedGroups)
            ? event.restrictedGroups.join(', ')
            : '',
          dateISO: toISODate(event.dateText ?? event.date ?? ''),
          gradientColors: Array.isArray(event.gradientColors) ? [...event.gradientColors] : [],
          capacity: event.capacity ?? '',
          hasDetailPage: event.hasDetailPage !== false,
        }
      : { ...empty }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleDateChange = (isoVal) => {
    setForm((f) => ({
      ...f,
      dateISO: isoVal,
      dateText: toDisplayDate(isoVal),
    }));
  };

  const addGradientColor = () => {
    setForm((f) => ({ ...f, gradientColors: [...f.gradientColors, '#6b21a8'] }));
  };

  const updateGradientColor = (index, value) => {
    setForm((f) => {
      const updated = [...f.gradientColors];
      updated[index] = value;
      return { ...f, gradientColors: updated };
    });
  };

  const removeGradientColor = (index) => {
    setForm((f) => ({
      ...f,
      gradientColors: f.gradientColors.filter((_, i) => i !== index),
    }));
  };

  const gradientPreview =
    form.gradientColors.length > 1
      ? `linear-gradient(135deg, ${form.gradientColors.join(', ')})`
      : form.gradientColors.length === 1
        ? `linear-gradient(135deg, ${form.gradientColors[0]}, ${form.gradientColors[0]}88)`
        : 'linear-gradient(135deg, #6b21a8, #7c3aed)';

  const checkForDuplicates = async () => {
    try {
      const allEvents = await api.events.getAll();
      const currentStart = form.startDate ? new Date(form.startDate).getTime() : null;

      if (!currentStart) return false;

      const duplicate = allEvents.find((e) => {
        if (event?.id === e.id) return false;

        const existingStart = e.startDate ? new Date(e.startDate).getTime() : null;
        if (!existingStart) return false;

        const timeDiff = Math.abs(currentStart - existingStart);
        const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
        const isSameName = e.name.trim().toLowerCase() === form.name.trim().toLowerCase();

        return timeDiff < TWO_HOURS_MS && isSameName;
      });

      return !!duplicate;
    } catch (err) {
      console.error('Failed to check for duplicates', err);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (await checkForDuplicates()) {
      const confirmed = window.confirm(
        'A similar event is already scheduled within a 2-hour window. Do you want to proceed anyway?'
      );
      if (!confirmed) {
        return;
      }
      console.log('Duplicate event override confirmed by user.');
    }

    setLoading(true);
    try {
      const tags = form.tagsInput
        ? form.tagsInput
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
      const payload = {
        ...form,
        tags,
        restrictedGroups: form.restrictedGroupsInput
          ? form.restrictedGroupsInput
              .split(',')
              .map((s) => parseInt(s.trim(), 10))
              .filter((id) => !isNaN(id))
          : [],
        capacity: form.capacity ? parseInt(form.capacity, 10) : null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };
      delete payload.tagsInput;
      delete payload.restrictedGroupsInput;
      delete payload.dateISO;

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
    <div
      className="modal-overlay"
      ref={modalRef}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" style={{ maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h3>{event?.id ? 'Edit Event' : 'New Event'}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <AdminIcon name="X" size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-row">
            <label>Event Name *</label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. KSS #153 — Knowledge Sharing Session"
              required
            />
          </div>
          <div className="form-row">
            <label>Short Name</label>
            <input
              value={form.shortName || ''}
              onChange={(e) => set('shortName', e.target.value)}
              placeholder="e.g. KSS #153"
            />
          </div>

          <div className="form-row">
            <label>Activity Category</label>
            <select value={form.category || ''} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label>Event Date</label>
            <input
              type="date"
              value={form.dateISO || ''}
              onChange={(e) => handleDateChange(e.target.value)}
              style={{ colorScheme: 'dark' }}
            />
            {form.dateText && (
              <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px' }}>
                Will display as: <strong style={{ color: 'var(--text)' }}>{form.dateText}</strong>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-row">
              <label>Start Date & Time</label>
              <input
                type="datetime-local"
                value={form.startDate || ''}
                onChange={(e) => set('startDate', e.target.value)}
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div className="form-row">
              <label>End Date & Time</label>
              <input
                type="datetime-local"
                value={form.endDate || ''}
                onChange={(e) => set('endDate', e.target.value)}
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-row">
              <label>Location</label>
              <input
                value={form.location || ''}
                onChange={(e) => set('location', e.target.value)}
                placeholder="e.g. Conference Hall"
              />
            </div>
            <div className="form-row">
              <label>Capacity</label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => set('capacity', e.target.value)}
                placeholder="e.g. 50"
                min="0"
              />
            </div>
          </div>

          <div className="form-row">
            <label>Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {ICON_OPTIONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => set('icon', iconName)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '5px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    border: form.icon === iconName ? '2px solid var(--c1)' : '1px solid var(--bdr)',
                    background: form.icon === iconName ? 'var(--c1a)' : 'var(--card)',
                    color: form.icon === iconName ? 'var(--c1)' : 'var(--t2)',
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  <AdminIcon name={iconName} size={14} />
                  {iconName}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <label>Status</label>
            <select value={form.status} onChange={(e) => set('status', e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label>Description</label>
            <ReactQuill
              theme="snow"
              value={form.description || ''}
              onChange={(val) => set('description', val)}
              modules={{
                toolbar: [
                  ['bold', 'italic'],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  ['link'],
                  ['clean'],
                ],
              }}
              style={{ background: 'var(--bg)', color: 'var(--text)' }}
            />
          </div>

          <div className="form-row">
            <label>Has Detail Page</label>
            <input
              type="checkbox"
              checked={form.hasDetailPage}
              onChange={(e) => set('hasDetailPage', e.target.checked)}
            />
          </div>

          <div className="form-row">
            <label>Tags (comma separated)</label>
            <input
              value={form.tagsInput || ''}
              onChange={(e) => set('tagsInput', e.target.value)}
              placeholder="e.g. react, typescript, web"
            />
          </div>

          <div className="form-row">
            <label>Restricted Groups (comma separated Group IDs)</label>
            <input
              value={form.restrictedGroupsInput || ''}
              onChange={(e) => set('restrictedGroupsInput', e.target.value)}
              placeholder="e.g. 1, 2 (Leave blank for public)"
            />
          </div>

          <div className="form-row">
            <label>Gradient Colors</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {form.gradientColors.map((color, i) => (
                <div key={i} style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => updateGradientColor(i, e.target.value)}
                  />
                  <button type="button" onClick={() => removeGradientColor(i)}>
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" onClick={addGradientColor}>
                Add Color
              </button>
            </div>
            <div
              style={{
                height: 40,
                borderRadius: 8,
                background: gradientPreview,
                marginTop: 10,
              }}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
