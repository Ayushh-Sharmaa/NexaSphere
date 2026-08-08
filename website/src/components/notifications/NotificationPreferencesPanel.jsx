import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../../utils/apiClient';
import { useStudentAuth } from '../../context/StudentAuthContext';
import './NotificationPreferencesPanel.css';

const CATEGORIES = [
  { key: 'events', label: 'Event Updates', desc: 'New events, registration openings' },
  { key: 'team', label: 'Team Invitations', desc: 'Core team & club invitations' },
  { key: 'activities', label: 'Activity Updates', desc: 'Club activity announcements' },
  { key: 'announcements', label: 'Admin Announcements', desc: 'Platform-wide announcements' },
  { key: 'deadlines', label: 'Deadline Reminders', desc: 'Registration closing reminders' },
  { key: 'attendance', label: 'Attendance & Points', desc: 'Attendance confirmations & points' },
  { key: 'promotions', label: 'Waitlist & Promotions', desc: 'Waitlist promotion updates' },
  { key: 'event_reminders', label: 'Event Reminders', desc: 'Reminders for your events' },
  {
    key: 'registration_confirmations',
    label: 'Registration Confirmations',
    desc: 'Confirmations for registrations',
  },
  { key: 'messages', label: 'Messages', desc: 'Direct messages and chats' },
  { key: 'recommendations', label: 'Event Recommendations', desc: 'Suggested events for you' },
  { key: 'portfolio_views', label: 'Portfolio Views', desc: 'When your portfolio is viewed' },
  { key: 'skill_requests', label: 'Skill Exchange Requests', desc: 'Requests from other users' },
];

const CHANNELS = [
  { key: 'in_app', label: 'In-App' },
  { key: 'push', label: 'Push' },
  { key: 'email', label: 'Email' },
  { key: 'sms', label: 'SMS' },
];

const FREQUENCIES = [
  { key: 'immediate', label: 'Immediate' },
  { key: 'hourly', label: 'Hourly Digest' },
  { key: 'daily', label: 'Daily Digest' },
  { key: 'disabled', label: 'Disabled' },
];

export default function NotificationPreferencesPanel({ userId, onClose }) {
  const { user: authUser } = useStudentAuth();
  const effectiveUserId = userId ?? authUser?.sub ?? authUser?.id ?? 'global';

  const [prefs, setPrefs] = useState({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [global, setGlobal] = useState({ dnd: false, quiet_start: '22:00', quiet_end: '08:00' });
  const copiedTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!effectiveUserId) return;
    (async () => {
      try {
        const data = await apiClient(`/api/notifications/preferences?userId=${effectiveUserId}`);
        const map = {};
        for (const p of data.preferences || []) {
          if (p.category === 'global') {
            setGlobal({
              dnd: !!p.dnd,
              quiet_start: p.quiet_start || '22:00',
              quiet_end: p.quiet_end || '08:00',
            });
          } else {
            map[p.category] = {
              email: p.email ?? true,
              push: p.push ?? true,
              in_app: p.in_app ?? true,
              sms: p.sms ?? true,
              frequency: p.frequency || 'immediate',
            };
          }
        }
        setPrefs(map);
      } catch {
        // Fallback defaults
      }
      setLoaded(true);
    })();
  }, [effectiveUserId]);

  const toggle = useCallback((category, channel) => {
    setPrefs((prev) => {
      const current = prev[category] || {
        email: true,
        push: true,
        in_app: true,
        sms: true,
        frequency: 'immediate',
      };
      return { ...prev, [category]: { ...current, [channel]: !current[channel] } };
    });
  }, []);

  const setFrequency = useCallback((category, freq) => {
    setPrefs((prev) => {
      const current = prev[category] || {
        email: true,
        push: true,
        in_app: true,
        sms: true,
        frequency: 'immediate',
      };
      return { ...prev, [category]: { ...current, frequency: freq } };
    });
  }, []);

  const toggleDnd = useCallback((val) => setGlobal((g) => ({ ...g, dnd: val })), []);

  const setQuiet = useCallback(
    (start, end) => setGlobal((g) => ({ ...g, quiet_start: start, quiet_end: end })),
    []
  );

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const bulk = Object.entries(prefs).map(([category, channels]) => ({
        category,
        email: !!channels.email,
        push: !!channels.push,
        in_app: !!channels.in_app,
        sms: !!channels.sms,
        frequency: channels.frequency || 'immediate',
      }));

      // Append global settings
      bulk.push({
        category: 'global',
        dnd: !!global.dnd,
        quiet_start: global.quiet_start,
        quiet_end: global.quiet_end,
      });

      await apiClient('/api/notifications/preferences/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: effectiveUserId, preferences: bulk }),
      });
    } catch {
      // ignore
    }
    setSaving(false);
  }, [prefs, effectiveUserId, global]);

  if (!loaded) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--t2)' }}>
        Loading preferences...
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: '850px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <h2 style={{ margin: 0, color: 'var(--t1)' }}>Notification Preferences</h2>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--t2)',
              cursor: 'pointer',
              fontSize: '1.2rem',
            }}
          >
            ✕
          </button>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th
                style={{
                  textAlign: 'left',
                  padding: '0.75rem 0.5rem',
                  color: 'var(--t1)',
                  fontSize: '0.85rem',
                }}
              >
                Category
              </th>
              {CHANNELS.map((ch) => (
                <th
                  key={ch.key}
                  style={{
                    textAlign: 'center',
                    padding: '0.75rem 0.5rem',
                    color: 'var(--t1)',
                    fontSize: '0.8rem',
                  }}
                >
                  {ch.label}
                </th>
              ))}
              <th
                style={{
                  textAlign: 'center',
                  padding: '0.75rem 0.5rem',
                  color: 'var(--t1)',
                  fontSize: '0.8rem',
                }}
              >
                Frequency
              </th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((cat) => {
              const channels = prefs[cat.key] || {
                email: true,
                push: true,
                in_app: true,
                sms: true,
                frequency: 'immediate',
              };
              return (
                <tr key={cat.key} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.85rem 0.5rem' }}>
                    <div style={{ color: 'var(--t1)', fontSize: '0.9rem' }}>{cat.label}</div>
                    <div style={{ color: 'var(--t2)', fontSize: '0.75rem' }}>{cat.desc}</div>
                  </td>
                  {CHANNELS.map((ch) => (
                    <td key={ch.key} style={{ textAlign: 'center', padding: '0.85rem 0.5rem' }}>
                      <button
                        onClick={() => toggle(cat.key, ch.key)}
                        style={{
                          width: '36px',
                          height: '22px',
                          borderRadius: '11px',
                          border: 'none',
                          background: channels[ch.key]
                            ? 'var(--c1, #cc1111)'
                            : 'rgba(255,255,255,0.15)',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background 0.2s',
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            top: '2px',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: '#fff',
                            transition: 'left 0.2s',
                            left: channels[ch.key] ? '16px' : '2px',
                          }}
                        />
                      </button>
                    </td>
                  ))}
                  <td style={{ textAlign: 'center', padding: '0.85rem 0.5rem' }}>
                    <select
                      value={channels.frequency || 'immediate'}
                      onChange={(e) => setFrequency(cat.key, e.target.value)}
                      style={{ padding: '6px', borderRadius: 6 }}
                    >
                      {FREQUENCIES.map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Global Settings */}
      <div
        style={{
          marginTop: '1.5rem',
          padding: '1rem',
          border: '1px solid var(--border)',
          borderRadius: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, color: 'var(--t1)' }}>Do Not Disturb</div>
            <div style={{ color: 'var(--t2)', fontSize: '0.85rem' }}>
              Temporarily disable non-critical notifications
            </div>
          </div>
          <div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={!!global.dnd}
                onChange={(e) => toggleDnd(e.target.checked)}
              />
              <span style={{ color: 'var(--t2)' }}>{global.dnd ? 'On' : 'Off'}</span>
            </label>
          </div>
        </div>

        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ minWidth: 120 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--t1)', fontWeight: 700 }}>
              Quiet Hours
            </div>
            <div style={{ color: 'var(--t2)', fontSize: '0.8rem' }}>Start — End (local time)</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="time"
              value={global.quiet_start}
              onChange={(e) => setQuiet(e.target.value, global.quiet_end)}
            />
            <span style={{ color: 'var(--t2)' }}>—</span>
            <input
              type="time"
              value={global.quiet_end}
              onChange={(e) => setQuiet(global.quiet_start, e.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            padding: '0.6rem 2rem',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--c1, #cc1111)',
            color: '#fff',
            fontSize: '0.9rem',
            cursor: 'pointer',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
