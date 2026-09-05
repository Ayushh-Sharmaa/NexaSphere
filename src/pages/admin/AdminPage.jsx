import { useMemo, useState } from 'react';
import {
  deleteCoreTeamApplication, deleteMembershipApplication, getCoreTeamApplications,
  getMembershipApplications, getStoredCustomEvents, saveCustomEvent,
  updateCoreTeamStatus, updateMembershipStatus,
} from '../../data/storage';
import { DynamicIcon } from '../../shared/Icons';

const STATUSES = ['all', 'pending', 'accepted', 'rejected', 'blacklisted'];
const CATEGORIES = ['Hackathon', 'Codathon', 'Ideathon', 'Promptathon', 'Workshop', 'Insight Session', 'Open Source Day', 'Tech Debate'];
const ICONS = ['Trophy', 'Terminal', 'Lightbulb', 'Sparkles', 'Wrench', 'Brain', 'GitBranch', 'MessageSquare'];
const blankEvent = { name: '', date: '', time: '', venue: '', category: 'Workshop', description: '', speakerName: '', speakerTitle: '', judges: '', topicsCovered: '', highlights: '', facultyInCharge: '', mediaDriveLink: '', status: 'upcoming', icon: 'Wrench' };

const statusStyle = status => ({
  pending: { color: '#f6c453', background: 'rgba(246,196,83,.12)' }, accepted: { color: '#4dd17d', background: 'rgba(77,209,125,.12)' },
  rejected: { color: '#fa6b6b', background: 'rgba(250,107,107,.12)' }, blacklisted: { color: '#fff', background: 'rgba(25,25,30,.85)' },
}[status] || {});

function ActionButton({ status, onClick }) {
  const labels = { accepted: 'Accept', rejected: 'Reject', blacklisted: 'Blacklist' };
  return <button type="button" onClick={onClick} style={{ ...statusStyle(status), border: '1px solid currentColor', borderRadius: 7, padding: '6px 9px', cursor: 'pointer', fontWeight: 700, fontSize: '.75rem' }}>{labels[status]}</button>;
}

function exportCsv(apps, name) {
  const keys = [...new Set(apps.flatMap(app => Object.keys(app)))];
  const escape = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const body = [keys.join(','), ...apps.map(app => keys.map(key => escape(Array.isArray(app[key]) ? app[key].join('; ') : app[key])).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([body], { type: 'text/csv' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: `${name}.csv` }); link.click(); URL.revokeObjectURL(url);
}

function ApplicationManager({ kind }) {
  const isMembership = kind === 'membership';
  const [apps, setApps] = useState(() => isMembership ? getMembershipApplications() : getCoreTeamApplications());
  const [filter, setFilter] = useState('all'); const [selected, setSelected] = useState(null);
  const filtered = useMemo(() => filter === 'all' ? apps : apps.filter(app => app.status === filter), [apps, filter]);
  const sync = () => setApps(isMembership ? getMembershipApplications() : getCoreTeamApplications());
  const update = (id, status) => { isMembership ? updateMembershipStatus(id, status) : updateCoreTeamStatus(id, status); sync(); };
  const remove = id => { if (!window.confirm('Delete this application permanently?')) return; isMembership ? deleteMembershipApplication(id) : deleteCoreTeamApplication(id); sync(); };
  return <div>
    <div style={{ display: 'flex', gap: 9, justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 18 }}>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>{STATUSES.map(status => <button type="button" key={status} onClick={() => setFilter(status)} className="btn btn-outline btn-sm" style={{ borderColor: filter === status ? 'var(--c1)' : undefined, color: filter === status ? 'var(--c1)' : undefined }}>{status}</button>)}</div>
      <button type="button" className="btn btn-outline btn-sm" onClick={() => exportCsv(filtered, `${kind}-applications`)}><DynamicIcon name="Download" size={14} /> Export CSV</button>
    </div>
    <div style={{ display: 'grid', gap: 11 }}>{filtered.length === 0 && <p style={{ color: 'var(--t3)' }}>No {filter === 'all' ? '' : filter} applications.</p>}{filtered.map(app => <article key={app.id} style={{ background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}><div><h3 style={{ margin: 0, color: 'var(--t1)' }}>{app.fullName}</h3><p style={{ margin: '4px 0', color: 'var(--t3)', fontSize: '.88rem' }}>{app.collegeEmail} · {app.whatsapp}</p></div><span style={{ ...statusStyle(app.status), padding: '5px 9px', borderRadius: 20, fontSize: '.72rem', fontWeight: 800, textTransform: 'uppercase' }}>{app.status}</span></div>
      <p style={{ color: 'var(--t2)', margin: '10px 0', fontSize: '.9rem' }}>{isMembership ? `${app.year || '—'} · ${app.branch || '—'} · ${(app.interests || []).join(', ') || 'No interests supplied'}` : `${app.domain || app.role || 'General'} · ${app.commitHours || 'Hours not supplied'} · ${app.skills || 'Skills not supplied'}`}</p>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}><ActionButton status="accepted" onClick={() => update(app.id, 'accepted')} /><ActionButton status="rejected" onClick={() => update(app.id, 'rejected')} /><ActionButton status="blacklisted" onClick={() => update(app.id, 'blacklisted')} /><button type="button" className="btn btn-outline btn-sm" onClick={() => setSelected(app)}><DynamicIcon name="Eye" size={14} /> Details</button><button type="button" className="btn btn-outline btn-sm" onClick={() => remove(app.id)}><DynamicIcon name="Trash2" size={14} /> Delete</button></div>
    </article>)}</div>
    {selected && <div role="dialog" aria-modal="true" onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,.7)', display: 'grid', placeItems: 'center', padding: 20 }}><div onClick={event => event.stopPropagation()} style={{ maxWidth: 650, width: '100%', maxHeight: '80vh', overflow: 'auto', background: 'var(--bg)', border: '1px solid var(--bdr2)', borderRadius: 14, padding: 22 }}><button type="button" onClick={() => setSelected(null)} style={{ float: 'right' }} className="btn btn-outline btn-sm">Close</button><h2>{selected.fullName}</h2>{Object.entries(selected).filter(([key]) => !['id', 'status'].includes(key)).map(([key, value]) => <div key={key} style={{ margin: '10px 0', color: 'var(--t2)' }}><strong style={{ color: 'var(--c1)', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}:</strong> {Array.isArray(value) ? value.join(', ') : String(value || '—')}</div>)}</div></div>}
  </div>;
}

function EventCreator() {
  const [form, setForm] = useState(blankEvent); const set = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const submit = event => { event.preventDefault(); saveCustomEvent(form); setForm(blankEvent); window.alert('Event saved. It is now available on the public events timeline.'); };
  const fields = [['name', 'Event topic / title', 'text'], ['date', 'Date', 'text'], ['time', 'Time', 'text'], ['venue', 'Venue', 'text'], ['speakerName', 'Presenter / guest speaker', 'text'], ['speakerTitle', 'Speaker designation', 'text'], ['judges', 'Jury / judges', 'text'], ['facultyInCharge', 'Faculty in-charge', 'text'], ['mediaDriveLink', 'Photos & videos drive link', 'url']];
  return <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 14 }}>{fields.map(([key, label, type]) => <label key={key} style={{ display: 'grid', gap: 6, color: 'var(--t2)' }}>{label}<input required={key === 'name' || key === 'date'} type={type} value={form[key]} onChange={event => set(key, event.target.value)} /></label>)}<label style={{ display: 'grid', gap: 6 }}>Activity category<select value={form.category} onChange={event => set('category', event.target.value)}>{CATEGORIES.map(item => <option key={item}>{item}</option>)}</select></label><label style={{ display: 'grid', gap: 6 }}>Status<select value={form.status} onChange={event => set('status', event.target.value)}><option value="upcoming">Upcoming</option><option value="completed">Completed</option></select></label><label style={{ display: 'grid', gap: 6 }}>SVG icon<select value={form.icon} onChange={event => set('icon', event.target.value)}>{ICONS.map(item => <option key={item}>{item}</option>)}</select></label>{[['description', 'Overview / summary'], ['topicsCovered', 'Topics covered'], ['highlights', 'Event highlights']].map(([key, label]) => <label key={key} style={{ gridColumn: '1 / -1', display: 'grid', gap: 6 }}>{label}<textarea required={key === 'description'} rows="3" value={form[key]} onChange={event => set(key, event.target.value)} /></label>)}<div style={{ gridColumn: '1 / -1' }}><button className="btn btn-primary" type="submit"><DynamicIcon name="Plus" size={16} /> Publish event</button></div></form>;
}

export default function AdminPage() {
  const [tab, setTab] = useState('membership');
  const tabs = [['membership', 'Membership applications', 'GraduationCap'], ['core', 'Core team applications', 'Users'], ['events', 'Create event', 'Calendar']];
  return <section style={{ maxWidth: 1120, margin: '0 auto', padding: '54px 24px 100px', minHeight: '75vh' }}><span className="cin-section-label">Private workspace</span><h1 className="section-title">Admin Control Panel</h1><p className="section-subtitle" style={{ marginBottom: 26 }}>Review candidate submissions and publish complete event records.</p><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>{tabs.map(([id, label, icon]) => <button type="button" className="btn btn-outline" key={id} onClick={() => setTab(id)} style={{ borderColor: tab === id ? 'var(--c1)' : undefined, color: tab === id ? 'var(--c1)' : undefined }}><DynamicIcon name={icon} size={16} /> {label}</button>)}</div>{tab === 'membership' && <ApplicationManager kind="membership" />}{tab === 'core' && <ApplicationManager kind="core" />}{tab === 'events' && <EventCreator />}</section>;
}
