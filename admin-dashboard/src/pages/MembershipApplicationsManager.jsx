import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Skeleton } from '../components/Skeleton';
import { AdminIcon } from '../components/AdminIcon';

const STATUS_COLORS = {
  pending:     { bg: 'rgba(255,180,0,.12)',  border: 'rgba(255,180,0,.35)',  text: '#ffb400' },
  accepted:    { bg: 'rgba(0,210,110,.12)',  border: 'rgba(0,210,110,.35)',  text: '#00d26a' },
  rejected:    { bg: 'rgba(204,17,17,.12)',  border: 'rgba(204,17,17,.35)',  text: '#CC1111' },
  blacklisted: { bg: 'rgba(120,0,200,.12)',  border: 'rgba(120,0,200,.35)',  text: '#9b59b6' },
};

const STATUS_LABELS = { pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected', blacklisted: 'Blacklisted' };

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase',
    }}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function DetailRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--text2)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</span>
      <span style={{ color: 'var(--text)', fontSize: 13, wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

function ApplicationCard({ app, onStatusChange, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const statusColors = STATUS_COLORS[app.status] || STATUS_COLORS.pending;

  const handleAction = async (status) => {
    setBusy(true);
    try { await onStatusChange(app.id, status); }
    finally { setBusy(false); }
  };

  const handleDelete = async () => {
    if (!confirm(`Remove application from ${app.fullName}? This cannot be undone.`)) return;
    setBusy(true);
    try { await onDelete(app.id); }
    finally { setBusy(false); }
  };

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${app.status !== 'pending' ? statusColors.border : 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      transition: 'box-shadow .15s',
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px',
        cursor: 'pointer',
      }} onClick={() => setExpanded(e => !e)}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,#CC1111,#880000)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 700, color: '#fff',
        }}>
          {(app.fullName || '?')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>{app.fullName}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
            <span>{app.branch}</span>
            {app.semester && <span>Sem {app.semester}</span>}
            {app.rollNumber && <span>{app.rollNumber}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <StatusBadge status={app.status} />
          <AdminIcon name={expanded ? 'ChevronUp' : 'ChevronDown'} size={16} />
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ paddingTop: 12, display: 'grid', gap: 0 }}>
            <DetailRow label="College Email" value={app.collegeEmail} />
            <DetailRow label="WhatsApp" value={app.whatsapp} />
            <DetailRow label="Roll Number" value={app.rollNumber} />
            <DetailRow label="Course" value={app.course} />
            <DetailRow label="Branch" value={app.branch} />
            <DetailRow label="Section" value={app.section} />
            <DetailRow label="Semester" value={app.semester} />
            <DetailRow label="Groups" value={app.groups} />
            <DetailRow label="Why Join" value={app.whyJoin} />
            <DetailRow label="Submitted" value={app.submittedAt ? new Date(app.submittedAt).toLocaleString() : '-'} />
            {app.statusUpdatedAt && <DetailRow label="Status Updated" value={new Date(app.statusUpdatedAt).toLocaleString()} />}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
            {app.status !== 'accepted' && (
              <button
                className="btn-primary"
                style={{ fontSize: 12, padding: '6px 14px', background: 'rgba(0,210,110,.15)', border: '1px solid rgba(0,210,110,.4)', color: '#00d26a' }}
                onClick={() => handleAction('accepted')}
                disabled={busy}
              >
                <AdminIcon name="Check" size={13} /> Accept
              </button>
            )}
            {app.status !== 'rejected' && (
              <button
                className="btn-primary"
                style={{ fontSize: 12, padding: '6px 14px', background: 'rgba(204,17,17,.12)', border: '1px solid rgba(204,17,17,.35)', color: '#CC1111' }}
                onClick={() => handleAction('rejected')}
                disabled={busy}
              >
                <AdminIcon name="X" size={13} /> Reject
              </button>
            )}
            {app.status !== 'blacklisted' && (
              <button
                className="btn-primary"
                style={{ fontSize: 12, padding: '6px 14px', background: 'rgba(120,0,200,.12)', border: '1px solid rgba(120,0,200,.35)', color: '#9b59b6' }}
                onClick={() => handleAction('blacklisted')}
                disabled={busy}
              >
                <AdminIcon name="Ban" size={13} /> Blacklist
              </button>
            )}
            {app.status !== 'pending' && (
              <button
                className="btn-primary"
                style={{ fontSize: 12, padding: '6px 14px', background: 'rgba(255,180,0,.1)', border: '1px solid rgba(255,180,0,.3)', color: '#ffb400' }}
                onClick={() => handleAction('pending')}
                disabled={busy}
              >
                <AdminIcon name="RotateCcw" size={13} /> Reset
              </button>
            )}
            <button
              className="btn-icon danger"
              style={{ marginLeft: 'auto', fontSize: 12, padding: '6px 10px' }}
              onClick={handleDelete}
              disabled={busy}
              aria-label="Delete application"
            >
              <AdminIcon name="Trash" size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function MembershipApplicationsManager() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadApps = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.membershipApps.getAll();
      setApps(data?.apps || []);
    } catch {
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadApps(); }, [loadApps]);

  const handleStatusChange = useCallback(async (id, status) => {
    await api.membershipApps.updateStatus(id, status);
    setApps(prev => prev.map(a => a.id === id ? { ...a, status, statusUpdatedAt: new Date().toISOString() } : a));
  }, []);

  const handleDelete = useCallback(async (id) => {
    await api.membershipApps.delete(id);
    setApps(prev => prev.filter(a => a.id !== id));
  }, []);

  const filtered = apps.filter(a => {
    if (filter !== 'all' && a.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (a.fullName || '').toLowerCase().includes(q) ||
        (a.collegeEmail || '').toLowerCase().includes(q) ||
        (a.rollNumber || '').toLowerCase().includes(q) ||
        (a.branch || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = apps.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Membership Applications</h2>
        <button className="btn-secondary" onClick={loadApps} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <AdminIcon name="RefreshCw" size={14} /> Refresh
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {[
          { key: 'all', label: 'Total', count: apps.length, color: 'var(--text2)' },
          { key: 'pending', label: 'Pending', count: counts.pending || 0, color: '#ffb400' },
          { key: 'accepted', label: 'Accepted', count: counts.accepted || 0, color: '#00d26a' },
          { key: 'rejected', label: 'Rejected', count: counts.rejected || 0, color: '#CC1111' },
          { key: 'blacklisted', label: 'Blacklisted', count: counts.blacklisted || 0, color: '#9b59b6' },
        ].map(({ key, label, count, color }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '8px 16px', borderRadius: 20, border: `1px solid ${filter === key ? color : 'var(--border)'}`,
              background: filter === key ? `${color}22` : 'var(--surface)',
              color: filter === key ? color : 'var(--text2)',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s',
            }}
          >
            {label}
            <span style={{
              background: filter === key ? color : 'var(--surface2)',
              color: filter === key ? '#000' : 'var(--text)',
              borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700,
            }}>{count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <AdminIcon name="Search" size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text2)', pointerEvents: 'none' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, roll number, branch..."
          style={{
            width: '100%', padding: '10px 12px 10px 36px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 13,
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {loading && <Skeleton height={80} count={5} />}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          {apps.length === 0
            ? 'No membership applications yet. When users submit the form, they will appear here.'
            : 'No applications match your search/filter.'}
        </div>
      )}

      {!loading && (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.map(app => (
            <ApplicationCard
              key={app.id}
              app={app}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
