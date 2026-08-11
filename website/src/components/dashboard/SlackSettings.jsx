import React, { useState, useEffect } from 'react';
import { getApiBase } from '../../utils/runtimeConfig';

/**
 * Slack Integration and Notifications Settings Component.
 * Handles student DM preferences and admin workspace notification toggles.
 */
export default function SlackSettings({ currentUser, authUser }) {
  const [slackUserId, setSlackUserId] = useState('');
  const [slackDmReminders, setSlackDmReminders] = useState(false);
  const [globalSlackConfig, setGlobalSlackConfig] = useState({
    connected: false,
    channel_name: '',
    channel_id: '',
    notify_new_events: true,
    notify_registrations: true,
    notify_announcements: true,
  });

  const [slackSuccess, setSlackSuccess] = useState(false);
  const [slackError, setSlackError] = useState(null);
  const [actionStatus, setActionStatus] = useState(null);

  const showStatus = (type, message) => {
    setActionStatus({ type, message });
    setTimeout(() => setActionStatus(null), 5000);
  };
  const [savingSlackSettings, setSavingSlackSettings] = useState(false);
  const [savingGlobalSlack, setSavingGlobalSlack] = useState(false);
  const [disconnectingSlack, setDisconnectingSlack] = useState(false);

  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    if (authUser) {
      setSlackUserId(authUser.slack_user_id || '');
      setSlackDmReminders(!!authUser.slack_dm_reminders);
    }
  }, [authUser]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('slack_success') === 'true') {
      setSlackSuccess(true);
      params.delete('slack_success');
      const cleanUrl =
        window.location.pathname +
        (params.toString() ? '?' + params.toString() : '') +
        window.location.hash;
      window.history.replaceState({}, '', cleanUrl);
    }
    const err = params.get('slack_error');
    if (err) {
      setSlackError(err);
      params.delete('slack_error');
      const cleanUrl =
        window.location.pathname +
        (params.toString() ? '?' + params.toString() : '') +
        window.location.hash;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, []);

  const fetchGlobalSlackConfig = async () => {
    if (!isAdmin) return;
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/admin/slack/config`, {
        credentials: 'include',
      });
      if (res.ok) {
        const config = await res.json();
        setGlobalSlackConfig(config);
      }
    } catch (err) {
      console.error('[SlackSettings] Error fetching global Slack config:', err);
    }
  };

  useEffect(() => {
    fetchGlobalSlackConfig();
  }, [authUser]);

  const handleSaveStudentSlack = async () => {
    setSavingSlackSettings(true);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/auth/slack-settings`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slackUserId,
          slackDmReminders,
        }),
      });
      if (res.ok) {
        showStatus('success', 'Slack DM preferences saved successfully!');
      } else {
        showStatus('error', 'Failed to save Slack settings.');
      }
    } catch (e) {
      console.error(e);
      showStatus('error', 'Error saving Slack settings.');
    } finally {
      setSavingSlackSettings(false);
    }
  };

  const handleSaveGlobalSlack = async () => {
    setSavingGlobalSlack(true);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/admin/slack/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notify_new_events: globalSlackConfig.notify_new_events,
          notify_registrations: globalSlackConfig.notify_registrations,
          notify_announcements: globalSlackConfig.notify_announcements,
        }),
        credentials: 'include',
      });
      if (res.ok) {
        showStatus('success', 'Workspace Slack notification settings updated!');
        fetchGlobalSlackConfig();
      } else {
        showStatus('error', 'Failed to update workspace Slack settings.');
      }
    } catch (e) {
      console.error(e);
      showStatus('error', 'Error updating workspace settings.');
    } finally {
      setSavingGlobalSlack(false);
    }
  };

  const handleDisconnectSlack = async () => {
    if (!confirm('Are you sure you want to disconnect Slack from this workspace?')) return;
    setDisconnectingSlack(true);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/admin/slack/disconnect`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        showStatus('success', 'Slack successfully disconnected!');
        fetchGlobalSlackConfig();
      } else {
        showStatus('error', 'Failed to disconnect Slack.');
      }
    } catch (e) {
      console.error(e);
      showStatus('error', 'Error disconnecting Slack.');
    } finally {
      setDisconnectingSlack(false);
    }
  };

  const handleConnectSlack = () => {
    const base = getApiBase();
    window.location.href = `${base}/api/slack/auth`;
  };

  return (
    <div
      style={{
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '28px',
        borderRadius: '16px',
        border: '1px solid var(--b2)',
        marginTop: '32px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <svg style={{ width: '28px', height: '28px', fill: 'var(--c1)' }} viewBox="0 0 24 24">
          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.042a2.528 2.528 0 0 1-2.522 2.52H8.823a2.528 2.528 0 0 1-2.52-2.52v-5.042zM8.823 5.043a2.528 2.528 0 0 1-2.52-2.522 2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52v2.522h-2.522zm0 1.261a2.528 2.528 0 0 1 2.522 2.52v5.043a2.528 2.528 0 0 1-2.522 2.52H3.78a2.528 2.528 0 0 1-2.52-2.52V8.824a2.528 2.528 0 0 1 2.52-2.52h5.043zm6.354 3.779a2.528 2.528 0 0 1 2.52-2.522 2.528 2.528 0 0 1 2.522 2.522 2.528 2.528 0 0 1-2.522 2.52h-2.52v-2.52zm-1.262 0a2.528 2.528 0 0 1-2.52 2.52H6.354a2.528 2.528 0 0 1-2.52-2.52V5.043a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.043zm-5.092 10.138a2.528 2.528 0 0 1 2.52 2.522 2.528 2.528 0 0 1-2.52-2.52 2.528 2.528 0 0 1-2.522-2.52v-2.522h2.522zm0-1.262a2.528 2.528 0 0 1-2.522-2.52v-5.043a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.52-2.52H8.823z" />
        </svg>
        <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0 }}>
          Slack Settings & Integrations
        </h2>
      </div>

      {/* Success/Error Banners */}
      {actionStatus && (
        <div
          role="status"
          style={{
            background: actionStatus.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${actionStatus.type === 'success' ? '#10b981' : '#ef4444'}`,
            borderRadius: '8px',
            padding: '12px 16px',
            color: actionStatus.type === 'success' ? '#34d399' : '#f87171',
            fontSize: '0.9rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>
            {actionStatus.type === 'success' ? '✅' : '⚠️'} {actionStatus.message}
          </span>
          <button
            onClick={() => setActionStatus(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '1.1rem',
              padding: '0 4px',
            }}
            aria-label="Dismiss status message"
          >
            &times;
          </button>
        </div>
      )}
      {slackSuccess && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#34d399',
            fontSize: '0.9rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          🎉 <strong>Success:</strong> Slack workspace integrated successfully!
        </div>
      )}
      {slackError && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#f87171',
            fontSize: '0.9rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          ⚠️ <strong>Error:</strong> Failed to connect Slack: {slackError}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px',
        }}
      >
        {/* Student/User settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3
            style={{
              fontSize: '1.15rem',
              color: 'var(--c1)',
              margin: '0 0 8px 0',
              borderBottom: '1px solid var(--b2)',
              paddingBottom: '8px',
            }}
          >
            Personal DM Reminders
          </h3>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <input
              id="slack-dm-reminders"
              type="checkbox"
              checked={slackDmReminders}
              onChange={(e) => setSlackDmReminders(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                accentColor: 'var(--c1)',
                marginTop: '4px',
              }}
            />
            <label
              htmlFor="slack-dm-reminders"
              style={{
                color: 'var(--t1)',
                cursor: 'pointer',
                fontSize: '0.95rem',
                lineHeight: '1.4',
              }}
            >
              <strong>Enable Slack Direct Messages</strong>
              <span
                style={{
                  display: 'block',
                  color: 'var(--t2)',
                  fontSize: '0.85rem',
                  marginTop: '2px',
                }}
              >
                Receive private DM reminders for upcoming events and deadline updates.
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              htmlFor="slack-user-id"
              style={{ color: 'var(--t1)', fontSize: '0.9rem', fontWeight: 'bold' }}
            >
              Slack User ID (Optional)
            </label>
            <input
              id="slack-user-id"
              type="text"
              placeholder="e.g. U12345678"
              value={slackUserId}
              onChange={(e) => setSlackUserId(e.target.value)}
              style={{
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--b2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--c1)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--b2)')}
            />
            <span style={{ color: 'var(--t2)', fontSize: '0.8rem' }}>
              Leave empty to automatically match using your NexaSphere email.
            </span>
          </div>

          <button
            onClick={handleSaveStudentSlack}
            disabled={savingSlackSettings}
            className="btn btn-primary"
            style={{
              alignSelf: 'flex-start',
              padding: '10px 20px',
              background: 'var(--c1)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              opacity: savingSlackSettings ? 0.7 : 1,
              transition: 'background 0.2s',
            }}
          >
            {savingSlackSettings ? 'Saving...' : 'Save DM Preferences'}
          </button>
        </div>

        {/* Admin workspace settings */}
        {isAdmin && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              borderLeft: '1px solid var(--b2)',
              paddingLeft: '32px',
            }}
          >
            <h3
              style={{
                fontSize: '1.15rem',
                color: 'var(--c1)',
                margin: '0 0 8px 0',
                borderBottom: '1px solid var(--b2)',
                paddingBottom: '8px',
              }}
            >
              Workspace Integration (Admin)
            </h3>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.02)',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--b2)',
              }}
            >
              <div style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--t2)' }}>
                  Status
                </span>
                <strong
                  style={{
                    color: globalSlackConfig.connected ? '#10b981' : '#ef4444',
                    fontSize: '0.95rem',
                  }}
                >
                  {globalSlackConfig.connected
                    ? `Connected to #${globalSlackConfig.channel_name || 'slack'}`
                    : 'Disconnected'}
                </strong>
              </div>

              {globalSlackConfig.connected ? (
                <button
                  onClick={handleDisconnectSlack}
                  disabled={disconnectingSlack}
                  style={{
                    padding: '8px 14px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #ef4444',
                    borderRadius: '8px',
                    color: '#f87171',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  {disconnectingSlack ? 'Disconnecting...' : 'Disconnect'}
                </button>
              ) : (
                <button
                  onClick={handleConnectSlack}
                  className="btn btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    background: '#fff',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Add to Slack
                </button>
              )}
            </div>

            {globalSlackConfig.connected && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--t1)' }}>
                    Notify in Slack Channel on:
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      id="notify-events"
                      type="checkbox"
                      checked={globalSlackConfig.notify_new_events}
                      onChange={(e) =>
                        setGlobalSlackConfig({
                          ...globalSlackConfig,
                          notify_new_events: e.target.checked,
                        })
                      }
                      style={{ accentColor: 'var(--c1)', width: '16px', height: '16px' }}
                    />
                    <label
                      htmlFor="notify-events"
                      style={{ color: 'var(--t1)', fontSize: '0.9rem', cursor: 'pointer' }}
                    >
                      New Events Published
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      id="notify-registrations"
                      type="checkbox"
                      checked={globalSlackConfig.notify_registrations}
                      onChange={(e) =>
                        setGlobalSlackConfig({
                          ...globalSlackConfig,
                          notify_registrations: e.target.checked,
                        })
                      }
                      style={{ accentColor: 'var(--c1)', width: '16px', height: '16px' }}
                    />
                    <label
                      htmlFor="notify-registrations"
                      style={{ color: 'var(--t1)', fontSize: '0.9rem', cursor: 'pointer' }}
                    >
                      New Registrations Confirmed
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      id="notify-announcements"
                      type="checkbox"
                      checked={globalSlackConfig.notify_announcements}
                      onChange={(e) =>
                        setGlobalSlackConfig({
                          ...globalSlackConfig,
                          notify_announcements: e.target.checked,
                        })
                      }
                      style={{ accentColor: 'var(--c1)', width: '16px', height: '16px' }}
                    />
                    <label
                      htmlFor="notify-announcements"
                      style={{ color: 'var(--t1)', fontSize: '0.9rem', cursor: 'pointer' }}
                    >
                      Admin Announcements
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleSaveGlobalSlack}
                  disabled={savingGlobalSlack}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '8px 16px',
                    border: '1px solid var(--c1)',
                    color: 'var(--c1)',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    background: 'transparent',
                    opacity: savingGlobalSlack ? 0.7 : 1,
                  }}
                >
                  {savingGlobalSlack ? 'Saving...' : 'Save Workspace Toggles'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
