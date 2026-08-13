import { useState, useEffect, useCallback } from 'react';
import { useStudentAuth } from '../../context/StudentAuthContext';
import prefsService from '../../services/notifications/preferences';
import DigestPreferences from './DigestPreferences';

const CATEGORIES = [
  { key: 'event_reminders', label: 'Event Reminders', desc: 'Reminders for your events' },
  {
    key: 'registration_confirmations',
    label: 'Registration Confirmations',
    desc: 'Confirmations for registrations',
  },
  { key: 'messages', label: 'Messages', desc: 'Direct messages and chats' },
  { key: 'announcements', label: 'Announcements', desc: 'Platform announcements' },
  { key: 'recommendations', label: 'Event Recommendations', desc: 'Suggested events for you' },
  { key: 'portfolio_views', label: 'Portfolio Views', desc: 'When your portfolio is viewed' },
  { key: 'skill_requests', label: 'Skill Exchange Requests', desc: 'Requests from other users' },
];

const CHANNELS = [
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

const defaultChannels = () => ({
  email: true,
  push: true,
  sms: true,
  frequency: 'immediate',
});

export default function NotificationPreferencesPanel({ userId, onClose }) {
  const { user: authUser } = useStudentAuth();
  const effectiveUserId = userId ?? authUser?.sub ?? authUser?.id;
  const [prefs, setPrefs] = useState({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [global, setGlobal] = useState({
    dnd: false,
    quiet_start: '22:00',
    quiet_end: '08:00',
  });

  useEffect(() => {
    if (!effectiveUserId) {
      setLoaded(true);
      return;
    }

    let active = true;
    const load = async () => {
      try {
        const list = await prefsService.fetchPreferences(effectiveUserId);
        if (!active) return;
        const map = {};
        for (const preference of list || []) {
          if (preference.category === 'global') {
            setGlobal((current) => ({
              ...current,
              dnd: Boolean(preference.dnd),
              quiet_start: preference.quiet_start || current.quiet_start,
              quiet_end: preference.quiet_end || current.quiet_end,
            }));
            continue;
          }
          map[preference.category] = {
            email: preference.email ?? true,
            push: preference.push ?? true,
            sms: preference.sms ?? true,
            frequency: preference.frequency || 'immediate',
          };
        }
        setPrefs(map);
      } finally {
        if (active) setLoaded(true);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [effectiveUserId]);

  const toggle = useCallback((category, channel) => {
    setPrefs((current) => {
      const channels = current[category] || defaultChannels();
      return { ...current, [category]: { ...channels, [channel]: !channels[channel] } };
    });
  }, []);

  const setFrequency = useCallback((category, frequency) => {
    setPrefs((current) => ({
      ...current,
      [category]: { ...(current[category] || defaultChannels()), frequency },
    }));
  }, []);

  const save = useCallback(async () => {
    if (!effectiveUserId) return;
    setSaving(true);
    try {
      const preferences = CATEGORIES.map(({ key: category }) => ({
        category,
        ...(prefs[category] || defaultChannels()),
      }));
      await prefsService.setPreferencesBulk(effectiveUserId, preferences);
      await prefsService.setPreference(effectiveUserId, 'global', global);
    } finally {
      setSaving(false);
    }
  }, [effectiveUserId, global, prefs]);

  if (!loaded) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--t2)' }}>
        Loading preferences...
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: '700px', margin: '0 auto' }}>
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
            type="button"
            onClick={onClose}
            aria-label="Close notification preferences"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--t2)',
              cursor: 'pointer',
              fontSize: '1.2rem',
            }}
          >
            ×
          </button>
        )}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: 'var(--t1)' }}>
              Category
            </th>
            {CHANNELS.map((channel) => (
              <th
                key={channel.key}
                style={{ textAlign: 'center', padding: '0.75rem 0.5rem', color: 'var(--t1)' }}
              >
                {channel.label}
              </th>
            ))}
            <th style={{ textAlign: 'center', padding: '0.75rem 0.5rem', color: 'var(--t1)' }}>
              Frequency
            </th>
          </tr>
        </thead>
        <tbody>
          {CATEGORIES.map((category) => {
            const channels = prefs[category.key] || defaultChannels();
            return (
              <tr key={category.key} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.85rem 0.5rem' }}>
                  <div style={{ color: 'var(--t1)', fontSize: '0.9rem' }}>{category.label}</div>
                  <div style={{ color: 'var(--t2)', fontSize: '0.75rem' }}>{category.desc}</div>
                </td>
                {CHANNELS.map((channel) => (
                  <td key={channel.key} style={{ textAlign: 'center', padding: '0.85rem 0.5rem' }}>
                    <button
                      type="button"
                      aria-label={`${category.label} ${channel.label}`}
                      aria-pressed={Boolean(channels[channel.key])}
                      onClick={() => toggle(category.key, channel.key)}
                      style={{
                        width: '36px',
                        height: '22px',
                        borderRadius: '11px',
                        border: 'none',
                        background: channels[channel.key]
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
                          left: channels[channel.key] ? '16px' : '2px',
                        }}
                      />
                    </button>
                  </td>
                ))}
                <td style={{ textAlign: 'center', padding: '0.85rem 0.5rem' }}>
                  <select
                    value={channels.frequency}
                    onChange={(event) => setFrequency(category.key, event.target.value)}
                    style={{ padding: '6px', borderRadius: 6 }}
                  >
                    {FREQUENCIES.map((frequency) => (
                      <option key={frequency.key} value={frequency.key}>
                        {frequency.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div
        style={{
          marginTop: '1rem',
          padding: '1rem',
          border: '1px solid var(--border)',
          borderRadius: 8,
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <span>
            <span style={{ display: 'block', fontWeight: 700, color: 'var(--t1)' }}>
              Do Not Disturb
            </span>
            <span style={{ color: 'var(--t2)', fontSize: '0.85rem' }}>
              Temporarily disable non-critical notifications
            </span>
          </span>
          <input
            type="checkbox"
            checked={global.dnd}
            onChange={(event) =>
              setGlobal((current) => ({ ...current, dnd: event.target.checked }))
            }
          />
        </label>

        <div style={{ marginTop: '0.75rem', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ minWidth: 120 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--t1)', fontWeight: 700 }}>
              Quiet Hours
            </div>
            <div style={{ color: 'var(--t2)', fontSize: '0.8rem' }}>Start — End (local time)</div>
          </div>
          <input
            type="time"
            value={global.quiet_start}
            onChange={(event) =>
              setGlobal((current) => ({ ...current, quiet_start: event.target.value }))
            }
          />
          <span style={{ color: 'var(--t2)' }}>—</span>
          <input
            type="time"
            value={global.quiet_end}
            onChange={(event) =>
              setGlobal((current) => ({ ...current, quiet_end: event.target.value }))
            }
          />
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
        <button
          type="button"
          onClick={save}
          disabled={saving || !effectiveUserId}
          style={{
            padding: '0.6rem 2rem',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--c1, #cc1111)',
            color: '#fff',
            fontSize: '0.9rem',
            cursor: 'pointer',
            opacity: saving || !effectiveUserId ? 0.6 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

      <DigestPreferences />
    </div>
  );
}
