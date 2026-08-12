/**
 * CertificateManager — Admin Dashboard page
 *
 * Full-featured certificate management system with 3 tabs:
 * 1. Template Builder — create/edit HTML/CSS or image overlay templates
 * 2. Issue Certificate — select event, fetch participants, bulk generate
 * 3. Issued Logs — search, view, revoke issued certificates
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Pagination } from '../components/Pagination';

const TABS = [
  { key: 'templates', label: 'Template Builder', icon: '🎨' },
  { key: 'issue', label: 'Issue Certificate', icon: '🎓' },
  { key: 'logs', label: 'Issued Logs', icon: '📋' },
];

const DEFAULT_TEMPLATES = [
  {
    id: 'default',
    name: 'Default (Red)',
    type: 'PRESET',
    gradient: 'linear-gradient(135deg, #CC1111, #880000)',
  },
  {
    id: 'gold',
    name: 'Gold',
    type: 'PRESET',
    gradient: 'linear-gradient(135deg, #f59e0b, #b45309)',
  },
  {
    id: 'silver',
    name: 'Silver',
    type: 'PRESET',
    gradient: 'linear-gradient(135deg, #94a3b8, #475569)',
  },
];

// ── Shared styles ───────────────────────────────────────────────────────

const tabBtn = (active) => ({
  background: active ? 'rgba(204,17,17,0.15)' : 'transparent',
  border: `1px solid ${active ? 'rgba(204,17,17,0.4)' : 'rgba(255,255,255,0.08)'}`,
  color: active ? '#fff' : 'rgba(255,255,255,0.6)',
  borderRadius: '10px',
  padding: '10px 20px',
  cursor: 'pointer',
  fontSize: '0.82rem',
  fontWeight: active ? 700 : 500,
  transition: 'all 0.2s',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontFamily: "'Rajdhani', sans-serif",
});

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '0.85rem',
  fontFamily: "'Inter', sans-serif",
  outline: 'none',
  transition: 'border 0.2s',
};

const sectionTitle = {
  fontSize: '0.75rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  opacity: 0.5,
  marginBottom: '14px',
};

// ── Template Builder Tab ────────────────────────────────────────────────

function TemplateBuilder({ onNotify }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('HTML_CSS');
  const [content, setContent] = useState('');
  const [placeholdersJson, setPlaceholdersJson] = useState('');
  const [saving, setSaving] = useState(false);
  const [previewBg, setPreviewBg] = useState('');
  const [previewCoords, setPreviewCoords] = useState({
    nameX: 50,
    nameY: 45,
    eventX: 50,
    eventY: 55,
    dateX: 50,
    dateY: 65,
  });

  const loadTemplates = useCallback(async () => {
    try {
      const data = await api.certificates.getTemplates();
      setTemplates(data?.templates || []);
    } catch {
      /* offline */
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleSave = async () => {
    if (!name.trim()) {
      onNotify('error', 'Template name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        type,
        content,
        placeholdersJson: JSON.stringify(previewCoords),
      };
      if (selectedTemplate?.id) {
        await api.certificates.updateTemplate(selectedTemplate.id, payload);
      } else {
        await api.certificates.createTemplate(payload);
      }
      loadTemplates();
      onNotify('success', 'Template saved');
      setName('');
      setContent('');
      setSelectedTemplate(null);
    } catch (e) {
      onNotify('error', e.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return;
    try {
      await api.certificates.deleteTemplate(id);
      loadTemplates();
    } catch {
      /* */
    }
  };

  const handleSelectPreset = (preset) => {
    setSelectedTemplate(preset);
    setPreviewBg(preset.gradient);
    setType('PRESET');
    setName(preset.name);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
      {/* Left: Editor */}
      <div>
        <div style={sectionTitle}>Template Name</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Gold Achievement Certificate"
          style={inputStyle}
        />

        <div style={{ ...sectionTitle, marginTop: '20px' }}>Template Type</div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {['HTML_CSS', 'IMAGE_OVERLAY'].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                ...tabBtn(type === t),
                padding: '8px 14px',
                fontSize: '0.78rem',
              }}
            >
              {t === 'HTML_CSS' ? 'HTML/CSS' : 'Image Overlay'}
            </button>
          ))}
        </div>

        {type === 'HTML_CSS' ? (
          <>
            <div style={sectionTitle}>HTML/CSS Content</div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              placeholder={
                '<div class="cert">\n  <h1>{{student_name}}</h1>\n  <p>{{event_name}}</p>\n  <p>{{issue_date}}</p>\n</div>'
              }
              style={{
                ...inputStyle,
                fontFamily: "'Fira Code', monospace",
                fontSize: '0.8rem',
                resize: 'vertical',
              }}
            />
            <div style={{ fontSize: '0.72rem', opacity: 0.4, marginTop: '6px' }}>
              Placeholders: {'{{student_name}}'}, {'{{event_name}}'}, {'{{certificate_id}}'},{' '}
              {'{{issue_date}}'}
            </div>
          </>
        ) : (
          <>
            <div style={sectionTitle}>Background Image URL</div>
            <input
              value={previewBg}
              onChange={(e) => setPreviewBg(e.target.value)}
              placeholder="https://example.com/certificate-bg.jpg"
              style={inputStyle}
            />
            <div style={{ ...sectionTitle, marginTop: '16px' }}>Text Placement (percentages)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {[
                { label: 'Name X', key: 'nameX' },
                { label: 'Name Y', key: 'nameY' },
                { label: 'Event X', key: 'eventX' },
                { label: 'Event Y', key: 'eventY' },
                { label: 'Date X', key: 'dateX' },
                { label: 'Date Y', key: 'dateY' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label style={{ fontSize: '0.7rem', opacity: 0.5 }}>{label}</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={previewCoords[key]}
                    onChange={(e) => setPreviewCoords((p) => ({ ...p, [key]: +e.target.value }))}
                    style={{ ...inputStyle, padding: '6px 8px', fontSize: '0.8rem' }}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Saving…' : '💾 Save Template'}
          </button>
          {selectedTemplate?.id && (
            <button
              onClick={() => {
                setSelectedTemplate(null);
                setName('');
                setContent('');
              }}
              style={{ ...tabBtn(false), padding: '8px 16px' }}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      {/* Right: Preview + Presets */}
      <div>
        <div style={sectionTitle}>Live Preview</div>
        <div
          style={{
            background: previewBg || 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '40px 32px',
            minHeight: '260px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: '1.2rem',
              fontWeight: 900,
              color: '#fff',
              marginBottom: '8px',
            }}
          >
            Student Name
          </div>
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
            Knowledge Sharing Session #153
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
            NS-CERT-XXXXXXXXXXXX
          </div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginTop: '12px' }}>
            March 15, 2025
          </div>
        </div>

        <div style={{ ...sectionTitle, marginTop: '24px' }}>Preset Templates</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {DEFAULT_TEMPLATES.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              style={{
                background: preset.gradient,
                border:
                  selectedTemplate?.id === preset.id
                    ? '2px solid #fff'
                    : '1px solid rgba(255,255,255,0.15)',
                borderRadius: '10px',
                padding: '12px 18px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>

        <div style={{ ...sectionTitle, marginTop: '24px' }}>Saved Templates</div>
        {templates.length === 0 ? (
          <div style={{ fontSize: '0.8rem', opacity: 0.4 }}>No custom templates saved yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {templates.map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.85rem' }}>
                    {t.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                    {t.type}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => {
                      setSelectedTemplate(t);
                      setName(t.name);
                      setType(t.type);
                      setContent(t.content || '');
                    }}
                    style={{ ...tabBtn(false), padding: '4px 10px', fontSize: '0.72rem' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    style={{
                      ...tabBtn(false),
                      padding: '4px 10px',
                      fontSize: '0.72rem',
                      color: '#ef4444',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Issue Certificate Tab ───────────────────────────────────────────────

function IssueCertificate({ onNotify }) {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [templateStyle, setTemplateStyle] = useState('default');
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualRoll, setManualRoll] = useState('');
  const [source, setSource] = useState('event');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.events
      .getAll()
      .then((data) => setEvents(data?.events || []))
      .catch(() => {});
  }, []);

  const fetchParticipants = async (eventId) => {
    setSelectedEvent(eventId);
    setParticipants([]);
    setSelectedIds(new Set());
    try {
      const data = await api.certificates.getParticipants(eventId);
      setParticipants(data?.participants || []);
    } catch {
      /* */
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === participants.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(participants.map((p) => p.id)));
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const ev = events.find((e) => e.id === selectedEvent);
      let students;

      if (source === 'event') {
        const attended = participants.filter((p) => selectedIds.has(p.id));
        students = attended.map((p) => ({
          name: p.fullName,
          email: p.email,
          rollNumber: p.rollNumber,
        }));
      } else {
        if (!manualName.trim() || !manualEmail.trim()) {
          onNotify('error', 'Name and email are required');
          setLoading(false);
          return;
        }
        students = [
          { name: manualName.trim(), email: manualEmail.trim(), rollNumber: manualRoll.trim() },
        ];
      }

      if (students.length === 0) {
        onNotify('error', 'No students selected');
        setLoading(false);
        return;
      }

      const data = await api.certificates.generate({
        eventId: selectedEvent,
        eventName: ev?.name || selectedEvent,
        templateStyle,
        students,
      });
      setResult(data);
      onNotify('success', `Generated ${data.generated} certificate(s)`);
    } catch (e) {
      onNotify('error', e.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Event selector */}
      <div style={sectionTitle}>Select Event</div>
      <select
        value={selectedEvent || ''}
        onChange={(e) => fetchParticipants(e.target.value)}
        style={{ ...inputStyle, width: '300px', marginBottom: '20px' }}
      >
        <option value="">Choose an event…</option>
        {events.map((ev) => (
          <option key={ev.id} value={ev.id}>
            {ev.name} ({ev.status})
          </option>
        ))}
      </select>

      {/* Source toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[
          { k: 'event', l: 'From Event Participants' },
          { k: 'manual', l: 'Manual Entry' },
        ].map((s) => (
          <button key={s.k} onClick={() => setSource(s.k)} style={tabBtn(source === s.k)}>
            {s.l}
          </button>
        ))}
      </div>

      {/* Template style */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['default', 'gold', 'silver'].map((s) => (
          <button key={s} onClick={() => setTemplateStyle(s)} style={tabBtn(templateStyle === s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {source === 'event' ? (
        <>
          {participants.length > 0 && (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}
              >
                <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>
                  {selectedIds.size} of {participants.length} selected
                </div>
                <button
                  onClick={toggleAll}
                  style={{ ...tabBtn(false), padding: '4px 12px', fontSize: '0.75rem' }}
                >
                  {selectedIds.size === participants.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div
                style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                {participants.map((p) => (
                  <label
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      background: selectedIds.has(p.id)
                        ? 'rgba(34,197,94,0.06)'
                        : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${selectedIds.has(p.id) ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      transition: 'all 0.15s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      style={{ accentColor: '#22c55e' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{p.fullName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                        {p.email} · {p.rollNumber}
                      </div>
                    </div>
                    <div
                      style={{
                        marginLeft: 'auto',
                        fontSize: '0.7rem',
                        color: 'rgba(255,255,255,0.3)',
                      }}
                    >
                      {p.status}
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}
          {selectedEvent && participants.length === 0 && (
            <div style={{ fontSize: '0.82rem', opacity: 0.5, padding: '20px 0' }}>
              No participants found for this event. Add participants via the Participants API or use
              Manual Entry.
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <div>
            <label
              style={{ display: 'block', fontSize: '0.75rem', opacity: 0.5, marginBottom: '4px' }}
            >
              Student Name *
            </label>
            <input
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="Full Name"
              style={inputStyle}
            />
          </div>
          <div>
            <label
              style={{ display: 'block', fontSize: '0.75rem', opacity: 0.5, marginBottom: '4px' }}
            >
              Email *
            </label>
            <input
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              placeholder="student@example.com"
              style={inputStyle}
            />
          </div>
          <div>
            <label
              style={{ display: 'block', fontSize: '0.75rem', opacity: 0.5, marginBottom: '4px' }}
            >
              Roll Number
            </label>
            <input
              value={manualRoll}
              onChange={(e) => setManualRoll(e.target.value)}
              placeholder="STU001"
              style={inputStyle}
            />
          </div>
        </div>
      )}

      <button
        className="btn-primary"
        onClick={handleGenerate}
        disabled={loading || !selectedEvent}
        style={{ opacity: loading || !selectedEvent ? 0.5 : 1, marginTop: '12px' }}
      >
        {loading ? 'Generating…' : '🎓 Generate Certificate(s)'}
      </button>

      {/* Results */}
      {result && (
        <div style={{ marginTop: '24px' }}>
          <div
            style={{
              background: 'rgba(34,197,94,0.06)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: '10px',
              padding: '14px 18px',
              display: 'flex',
              gap: '24px',
              fontSize: '0.85rem',
            }}
          >
            <span style={{ color: '#22c55e', fontWeight: 700 }}>
              ✓ Generated: {result.generated}
            </span>
            {result.skipped > 0 && (
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>⟳ Skipped: {result.skipped}</span>
            )}
          </div>
          {result.certificates?.map((c) => (
            <CertRow key={c.certificate_id} cert={c} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Issued Logs Tab ─────────────────────────────────────────────────────

function IssuedLogs({ onNotify }) {
  const [certificates, setCertificates] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const loadCerts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.certificates.getAll({ page, limit: pageSize });
      setCertificates(data?.certificates || []);
      setTotal(data?.total ?? 0);
      setTotalPages(data?.totalPages ?? 0);
    } catch {
      /* */
    }
    setLoading(false);
  }, [page, pageSize]);

  useEffect(() => {
    loadCerts();
  }, [loadCerts]);

  // Reset to page 1 when search text changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  const filtered = certificates.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.studentName?.toLowerCase().includes(q) ||
      c.studentEmail?.toLowerCase().includes(q) ||
      c.studentRollNumber?.toLowerCase().includes(q) ||
      c.eventName?.toLowerCase().includes(q) ||
      c.certificateId?.toLowerCase().includes(q)
    );
  });

  const handleRevoke = async (id) => {
    if (!confirm('Revoke this certificate?')) return;
    try {
      await api.certificates.revoke(id);
      loadCerts();
    } catch {
      /* */
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, roll number, event, or cert ID…"
          style={{ ...inputStyle, maxWidth: '400px' }}
        />
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>Loading…</div>
      ) : total === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', opacity: 0.4 }}>
          No certificates found.
        </div>
      ) : total > 0 && filtered.length === 0 ? (
        <>
          <div style={{ padding: '40px', textAlign: 'center', opacity: 0.4 }}>
            No certificates match your search.
          </div>
          <button
            className="btn btn-secondary"
            style={{ marginTop: 8 }}
            onClick={() => setSearch('')}
          >
            Clear search
          </button>
        </>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    color: 'rgba(255,255,255,0.5)',
                    fontWeight: 600,
                  }}
                >
                  Certificate ID
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    color: 'rgba(255,255,255,0.5)',
                    fontWeight: 600,
                  }}
                >
                  Student
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    color: 'rgba(255,255,255,0.5)',
                    fontWeight: 600,
                  }}
                >
                  Event
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    color: 'rgba(255,255,255,0.5)',
                    fontWeight: 600,
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    textAlign: 'right',
                    padding: '10px 12px',
                    color: 'rgba(255,255,255,0.5)',
                    fontWeight: 600,
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.certificateId}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <td
                    style={{
                      padding: '10px 12px',
                      fontFamily: 'monospace',
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '0.75rem',
                    }}
                  >
                    {c.certificateId}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{c.studentName}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                      {c.studentEmail}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.7)' }}>
                    {c.eventName}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        background: c.revoked ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.1)',
                        color: c.revoked ? '#ef4444' : '#22c55e',
                        border: `1px solid ${c.revoked ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.2)'}`,
                      }}
                    >
                      {c.revoked ? 'Revoked' : 'Active'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <a
                        href={`/verify/${c.certificateId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          ...tabBtn(false),
                          padding: '4px 10px',
                          fontSize: '0.72rem',
                          textDecoration: 'none',
                        }}
                      >
                        Verify
                      </a>
                      {!c.revoked && (
                        <button
                          onClick={() => handleRevoke(c.certificateId)}
                          style={{
                            ...tabBtn(false),
                            padding: '4px 10px',
                            fontSize: '0.72rem',
                            color: '#ef4444',
                          }}
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}

// ── CertRow helper ──────────────────────────────────────────────────────

function CertRow({ cert }) {
  const [copied, setCopied] = useState(false);
  const verifyUrl = `${window.location.origin}/verify/${cert.certificate_id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(verifyUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr auto',
        gap: '12px',
        alignItems: 'center',
        padding: '10px 14px',
        background: 'rgba(34,197,94,0.04)',
        borderRadius: '8px',
        border: '1px solid rgba(34,197,94,0.12)',
        marginBottom: '6px',
        fontSize: '0.85rem',
      }}
    >
      <div>
        <div style={{ fontWeight: 600, color: '#fff' }}>{cert.student_name}</div>
        <div
          style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.72rem', fontFamily: 'monospace' }}
        >
          {cert.certificate_id}
        </div>
      </div>
      <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.78rem', wordBreak: 'break-all' }}>
        {verifyUrl}
      </div>
      <button
        onClick={copyLink}
        title="Copy verify link"
        style={{
          background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.07)',
          border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.12)'}`,
          color: copied ? '#22c55e' : 'rgba(255,255,255,0.72)',
          borderRadius: '6px',
          padding: '6px 10px',
          cursor: 'pointer',
          fontSize: '0.75rem',
          whiteSpace: 'nowrap',
          transition: 'all 0.2s',
        }}
      >
        {copied ? '✓ Copied' : 'Copy Link'}
      </button>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

export function CertificateManager() {
  const [activeTab, setActiveTab] = useState('templates');
  const [notif, setNotif] = useState(null);

  const onNotify = (type, message) => {
    setNotif({ type, message });
    setTimeout(() => setNotif(null), 3000);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Certificate Manager</h2>
      </div>

      {/* Notification */}
      {notif && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            background: notif.type === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
            border: `1px solid ${notif.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
            color: notif.type === 'error' ? '#f87171' : '#22c55e',
            borderRadius: '10px',
            padding: '12px 20px',
            fontSize: '0.85rem',
            fontWeight: 600,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          {notif.message}
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={tabBtn(activeTab === tab.key)}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ maxWidth: '1000px' }}>
        {activeTab === 'templates' && <TemplateBuilder onNotify={onNotify} />}
        {activeTab === 'issue' && <IssueCertificate onNotify={onNotify} />}
        {activeTab === 'logs' && <IssuedLogs onNotify={onNotify} />}
      </div>
    </div>
  );
}
