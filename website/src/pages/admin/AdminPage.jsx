import React, { useState, useEffect } from 'react';
import DashboardStats from '../../components/admin/analytics/DashboardStats';
import UserGrowthChart from '../../components/admin/analytics/UserGrowthChart';
import EventAttendanceChart from '../../components/admin/analytics/EventAttendanceChart';
import useLocalStorage from '../../hooks/useLocalStorage';
import '../../components/admin/analytics/analytics.css';

import HeatmapView from './analytics/HeatmapView';
import SessionPlayer from './analytics/SessionPlayer';
import SegmentationDashboard from './analytics/SegmentationDashboard';
import SyncDashboard from './SyncDashboard';
import CertificateTemplateEditor from './CertificateTemplateEditor';
import PortfolioModerationQueue from './PortfolioModerationQueue';
import QRScanner from './QRScanner';
import WaitlistManager from './WaitlistManager';

export default function AdminPage({ onBack }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useLocalStorage('ns_admin_token', null);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [twoFactorState, setTwoFactorState] = useState(null); // { type: 'setup' | 'challenge', data: any }
  const [totpCode, setTotpCode] = useState('');
  const [data, setData] = useState({
    stats: null,
    growth: [],
    events: [],
  });

  const fetchAnalytics = async (authToken) => {
    try {
      setLoading(true);
      const base = (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '');
      const headers = { Authorization: `Bearer ${authToken}` };

      const [statsRes, growthRes, eventsRes] = await Promise.all([
        fetch(`${base}/api/admin/analytics/stats`, { headers }),
        fetch(`${base}/api/admin/analytics/growth`, { headers }),
        fetch(`${base}/api/admin/analytics/events`, { headers }),
      ]);

      if (statsRes.status === 401) {
        setToken(null);
        throw new Error('Session expired. Please login again.');
      }

      if (!statsRes.ok || !growthRes.ok || !eventsRes.ok) {
        throw new Error('Failed to fetch analytics data.');
      }

      const [stats, growth, events] = await Promise.all([
        statsRes.json(),
        growthRes.json(),
        eventsRes.json(),
      ]);

      setData({ stats, growth, events });
      setError(null);
    } catch (err) {
      setError(err.message);
      // Fallback for dev environment if token is present but API fails
      if (import.meta.env.DEV && authToken) {
        console.warn('Using fallback mock data for analytics');
        setData({
          stats: {
            totalUsers: 1240,
            activeRegistrations: 85,
            upcomingEvents: 3,
            conversionRate: '12.5%',
          },
          growth: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            registrations: Math.floor(Math.random() * 20) + i,
          })),
          events: [
            { name: 'KSS #153', capacity: 100, attendance: 92, waitlist: 15 },
            { name: 'AI Workshop', capacity: 60, attendance: 58, waitlist: 20 },
          ],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAnalytics(token);
    }
  }, [token]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const base = getApiBase();
    const url = `${base}/api/admin/metrics/stream`;

    const listeners = {};
    let closed = false;
    let reconnectTimeout = undefined;

    async function connect() {
      // Re-check closed after any await — component may have unmounted
      // while fetch() was in flight, making the earlier clearTimeout
      // in sseClient.close() a no-op since reconnectTimeout was not
      // yet assigned at that point.
      if (closed) return;
      try {
        const response = await fetch(url, {
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401) {
            setIsLoggedIn(false);
            return;
          }
          throw new Error(`SSE connection failed: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let currentEvent = '';
        let currentData = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              currentData = line.slice(6);
            } else if (line === '' && currentEvent && currentData) {
              const event = { data: currentData };
              (listeners[currentEvent] || []).forEach((fn) => fn(event));
              currentEvent = '';
              currentData = '';
            }
          }
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('[AdminPage] SSE metrics stream interrupted or reconnecting:', err.message);
        }
      }

      // Re-check closed after await — if component unmounted while fetch
      // was in flight, closed is now true and we must not schedule a reconnect.
      if (!closed) {
        reconnectTimeout = setTimeout(connect, 3000);
      }
    }

    const sseClient = {
      addEventListener(event, fn) {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(fn);
      },
      close() {
        closed = true;
        clearTimeout(reconnectTimeout);
      },
    };

    sseClient.addEventListener('registration', (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const payload = parsed.data;

        setData((prev) => {
          const currentStats = prev.stats || {
            totalUsers: null,
            activeRegistrations: null,
            upcomingEvents: null,
            conversionRate: null,
          };
          const nextStats = {
            ...currentStats,
            totalUsers: currentStats.totalUsers !== null ? currentStats.totalUsers + 1 : 1,
            activeRegistrations:
              currentStats.activeRegistrations !== null ? currentStats.activeRegistrations + 1 : 1,
          };

          const todayStr = new Date().toISOString().split('T')[0];
          const updatedGrowth = [...(prev.growth || [])];
          const todayIdx = updatedGrowth.findIndex((g) => g.date === todayStr);
          if (todayIdx >= 0) {
            updatedGrowth[todayIdx] = {
              ...updatedGrowth[todayIdx],
              registrations: (updatedGrowth[todayIdx].registrations || 0) + 1,
            };
          } else {
            updatedGrowth.push({ date: todayStr, registrations: 1 });
          }

          return {
            ...prev,
            stats: nextStats,
            growth: updatedGrowth,
          };
        });
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[AdminPage] Failed to parse registration SSE message:', err.message);
        }
      }
    });

    sseClient.addEventListener('login', (event) => {
      try {
        JSON.parse(event.data);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[AdminPage] Failed to parse login SSE message:', err.message);
        }
      }
    });

    connect();

    return () => {
      sseClient.close();
    };
  }, [isLoggedIn]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const base = (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '');
      const res = await fetch(`${base}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const result = await res.json();
      if (!res.ok && res.status !== 202) throw new Error(result.error || 'Login failed');

      if (result.requiresTwoFactorSetup) {
        setTwoFactorState({ type: 'setup', data: result });
      } else if (result.requiresTwoFactor) {
        setTwoFactorState({ type: 'challenge', data: result });
      } else {
        setToken(result.token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTwoFactor = async (e, type) => {
    e.preventDefault();
    try {
      setLoading(true);
      const base = (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '');
      const endpoint = type === 'setup' ? '/api/admin/2fa/verify-setup' : '/api/admin/2fa/verify';
      const tokenKey = type === 'setup' ? 'setupToken' : 'challengeToken';

      const res = await fetch(`${base}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [tokenKey]: twoFactorState.data[tokenKey],
          code: totpCode,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '2FA verification failed');

      setTwoFactorState(null);
      setTotpCode('');
      setToken(result.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setToken(null);
    try {
      const base = getApiBase();
      await fetch(`${base}/api/admin/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[AdminPage] Logout error:', err.message);
      }
    }
    setIsLoggedIn(false);
    setData({ stats: null, growth: [], events: [] });
  };

  if (!token) {
    if (twoFactorState) {
      const isSetup = twoFactorState.type === 'setup';
      return (
        <div className="analytics-dashboard" style={{ maxWidth: 500, marginTop: '10vh' }}>
          <button onClick={() => setTwoFactorState(null)} className="btn-back">
            ← Cancel
          </button>
          <div className="chart-container" style={{ padding: '2rem' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              {isSetup ? 'Setup Two-Factor Authentication' : 'Two-Factor Authentication'}
            </h2>
            {isSetup && (
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <p style={{ marginBottom: '1rem', color: 'var(--t2)' }}>
                  Scan this QR code with your authenticator app (e.g., Google Authenticator, Authy):
                </p>
                <img
                  src={twoFactorState.data.qrCodeDataUrl}
                  alt="2FA QR Code"
                  style={{ background: 'white', padding: '1rem', borderRadius: '8px' }}
                />
                <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--t2)' }}>
                  Manual entry key:{' '}
                  <strong style={{ userSelect: 'all' }}>{twoFactorState.data.secret}</strong>
                </p>
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    textAlign: 'left',
                  }}
                >
                  <h4 style={{ marginBottom: '0.5rem', color: 'var(--c1)' }}>
                    Backup Codes (Save these!)
                  </h4>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.5rem',
                      fontFamily: 'monospace',
                    }}
                  >
                    {twoFactorState.data.backupCodes.map((code) => (
                      <div key={code}>{code}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {!isSetup && (
              <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--t2)' }}>
                Enter the 6-digit code from your authenticator app, or a backup code.
              </p>
            )}
            <form
              onSubmit={(e) => handleVerifyTwoFactor(e, twoFactorState.type)}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <input
                type="text"
                placeholder="6-digit code or backup code"
                aria-label="Authenticator Code"
                className="input-field"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </form>
            {error && (
              <p
                style={{
                  color: '#f87171',
                  fontSize: '0.9rem',
                  marginTop: '1rem',
                  textAlign: 'center',
                }}
              >
                {error}
              </p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="analytics-dashboard" style={{ maxWidth: 400, marginTop: '10vh' }}>
        <button onClick={onBack} className="btn-back">
          ← Back
        </button>
        <div className="chart-container" style={{ padding: '2rem' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Admin Login</h2>
          <form
            onSubmit={handleLogin}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <input
              type="text"
              placeholder="Username"
              aria-label="Username"
              className="input-field"
              value={loginData.username}
              onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Password"
              aria-label="Password"
              className="input-field"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Authenticating...' : 'Login to Dashboard'}
            </button>
          </form>
          {error && (
            <p
              style={{
                color: '#f87171',
                fontSize: '0.9rem',
                marginTop: '1rem',
                textAlign: 'center',
              }}
            >
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="analytics-dashboard">
      <header
        style={{
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <button onClick={onBack} className="btn-back">
            ← Back to Home
          </button>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', marginTop: '0.5rem' }}>
            Admin Analytics
          </h1>
          <p style={{ opacity: 0.7 }}>Visualizing platform growth and event performance.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-outline"
            onClick={() => fetchAnalytics(token)}
            disabled={loading}
          >
            Refresh
          </button>
          <button
            className="btn btn-outline"
            onClick={handleLogout}
            style={{ borderColor: 'rgba(239, 68, 68, 0.5)', color: '#ef4444' }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {[
          'overview',
          'heatmaps',
          'recordings',
          'segments',
          'security',
          'sync',
          'certificates',
          'moderation',
          'scanner',
          'waitlist',
        ].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--c1)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--c1)' : 'var(--t2)',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading && <div className="loader-overlay">Loading...</div>}

      {activeTab === 'overview' && (
        <>
          <DashboardStats stats={data.stats} />
          <div className="charts-grid">
            <UserGrowthChart data={data.growth} />
            <EventAttendanceChart data={data.events} />
          </div>
        </>
      )}

      {activeTab === 'heatmaps' && <HeatmapView />}
      {activeTab === 'recordings' && <SessionPlayer />}
      {activeTab === 'segments' && <SegmentationDashboard />}
      {activeTab === 'security' && <AdminSecuritySettings token={token} />}
      {activeTab === 'sync' && <SyncDashboard token={token} />}
      {activeTab === 'certificates' && <CertificateTemplateEditor token={token} />}
      {activeTab === 'moderation' && <PortfolioModerationQueue token={token} />}
      {activeTab === 'scanner' && <QRScanner token={token} />}
      {activeTab === 'waitlist' && <WaitlistManager />}
    </div>
  );
}

function AdminSecuritySettings({ token }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [setupState, setSetupState] = useState(null); // null, 'init', 'verify'
  const [setupData, setSetupData] = useState(null);
  const [totpCode, setTotpCode] = useState('');

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const base = (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '');
      const res = await fetch(`${base}/api/admin/2fa/settings/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTwoFactorEnabled(data.enabled);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleInitSetup = async () => {
    try {
      setLoading(true);
      setError(null);
      const base = (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '');
      const res = await fetch(`${base}/api/admin/2fa/settings/setup/init`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize setup');

      setSetupData(data);
      setSetupState('verify');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySetup = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const base = (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '');
      const res = await fetch(`${base}/api/admin/2fa/settings/setup/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ setupToken: setupData.setupToken, code: totpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify');

      setSetupState(null);
      setSetupData(null);
      setTwoFactorEnabled(true);
      setTotpCode('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (
      !window.confirm(
        'Are you sure you want to disable 2FA? This will make your account less secure.'
      )
    )
      return;
    try {
      setLoading(true);
      setError(null);
      const base = (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '');
      const res = await fetch(`${base}/api/admin/2fa/settings/disable`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to disable 2FA');

      setTwoFactorEnabled(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: '2rem',
        background: '#1e293b',
        borderRadius: '16px',
        maxWidth: '600px',
        margin: '0 auto',
      }}
    >
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--t1)' }}>Security Settings</h2>

      <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '1rem' }}>Two-Factor Authentication (2FA)</h3>

        {loading && !setupState && <p>Loading...</p>}
        {error && <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>}

        {!loading && !setupState && (
          <div>
            <p style={{ marginBottom: '1rem', color: 'var(--t2)' }}>
              Status:{' '}
              <strong style={{ color: twoFactorEnabled ? '#10b981' : '#ef4444' }}>
                {twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </strong>
            </p>
            {twoFactorEnabled ? (
              <button
                className="btn btn-outline"
                style={{ borderColor: '#ef4444', color: '#ef4444' }}
                onClick={handleDisable}
              >
                Disable 2FA
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleInitSetup}>
                Enable 2FA
              </button>
            )}
          </div>
        )}

        {setupState === 'verify' && setupData && (
          <div>
            <p style={{ marginBottom: '1rem', color: 'var(--t2)' }}>
              Scan the QR code with your authenticator app:
            </p>
            <img
              src={setupData.qrCodeDataUrl}
              alt="QR Code"
              style={{
                background: 'white',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
              }}
            />
            <p style={{ marginBottom: '1rem', color: 'var(--t2)' }}>
              Or enter this code manually: <strong>{setupData.secret}</strong>
            </p>

            <div
              style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '8px',
              }}
            >
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--c1)' }}>
                Backup Codes (Save these!)
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                  fontFamily: 'monospace',
                }}
              >
                {setupData.backupCodes.map((c) => (
                  <div key={c}>{c}</div>
                ))}
              </div>
            </div>

            <form onSubmit={handleVerifySetup} style={{ display: 'flex', gap: '1rem' }}>
              <input
                type="text"
                className="input-field"
                placeholder="6-digit code"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setSetupState(null)}>
                Cancel
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
