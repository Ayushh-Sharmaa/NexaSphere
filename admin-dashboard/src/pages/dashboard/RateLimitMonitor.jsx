/**
 * RateLimitMonitor.jsx
 *
 * Admin dashboard page for the Rate Limiting & Throttling system.
 * Shows: live status, top offenders, endpoint distribution,
 * auto-blocked IPs, whitelist/blacklist management, per-user overrides.
 *
 * Uses the same fetch/auth patterns as AuditLogViewer.jsx in this repo.
 */

import { useState, useEffect, useCallback } from 'react';
import { useLogoutAwareInterval } from '../../hooks/useLogoutAwareInterval';

const API = '/api/admin';

// ── tiny fetch helper ────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// ── sub-components ────────────────────────────────────────────────────────────

function Badge({ children, color = 'blue' }) {
  const palette = {
    blue: 'bg-blue-100 text-blue-800',
    red: 'bg-red-100 text-red-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    gray: 'bg-gray-100 text-gray-700',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${palette[color]}`}
    >
      {children}
    </span>
  );
}

function StatCard({ label, value, sub, color = 'blue' }) {
  const border = {
    blue: 'border-blue-500',
    red: 'border-red-500',
    green: 'border-green-500',
    yellow: 'border-yellow-500',
  };
  return (
    <div className={`bg-white rounded-lg border-l-4 ${border[color]} shadow-sm p-4`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function IpListManager({ title, apiPath, description }) {
  const [list, setList] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const field = apiPath.includes('whitelist') ? 'whitelist' : 'blacklist';

  const load = useCallback(async () => {
    try {
      const data = await apiFetch(`/rate-limits/${field}`);
      setList(data[field] || []);
    } catch {
      setError('Failed to load list');
    }
  }, [field]);

  useEffect(() => {
    load();
  }, [load]);

  async function addIp() {
    if (!input.trim()) return;
    setLoading(true);
    try {
      await apiFetch(`/rate-limits/${field}`, {
        method: 'POST',
        body: JSON.stringify({ ip: input.trim() }),
      });
      setInput('');
      await load();
    } catch {
      setError('Failed to add IP');
    } finally {
      setLoading(false);
    }
  }

  async function removeIp(ip) {
    try {
      await apiFetch(`/rate-limits/${field}/${encodeURIComponent(ip)}`, { method: 'DELETE' });
      await load();
    } catch {
      setError('Failed to remove IP');
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 mb-3">{description}</p>

      <div className="flex gap-2 mb-3">
        <input
          className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="IP address (e.g. 203.0.113.0)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addIp()}
        />
        <button
          onClick={addIp}
          disabled={loading}
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {error && <p className="text-red-500 text-xs mb-2">{error}</p>}

      {list.length === 0 ? (
        <p className="text-gray-400 text-sm italic">No entries.</p>
      ) : (
        <ul className="space-y-1 max-h-40 overflow-y-auto">
          {list.map((ip) => (
            <li
              key={ip}
              className="flex items-center justify-between bg-gray-50 rounded px-3 py-1.5 text-sm font-mono"
            >
              <span>{ip}</span>
              <button
                onClick={() => removeIp(ip)}
                className="text-red-500 hover:text-red-700 text-xs ml-2"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OverridePanel() {
  const [identifier, setIdentifier] = useState('');
  const [limit, setLimit] = useState('');
  const [msg, setMsg] = useState('');

  async function setOverride() {
    if (!identifier || !limit) {
      setMsg('Both fields required');
      return;
    }
    try {
      await apiFetch('/rate-limits/override', {
        method: 'POST',
        body: JSON.stringify({ identifier, limitPerMinute: parseInt(limit) }),
      });
      setMsg(`✓ Override set for ${identifier}`);
      setIdentifier('');
      setLimit('');
    } catch {
      setMsg('Failed to set override');
    }
  }

  async function removeOverride() {
    if (!identifier) {
      setMsg('Identifier required');
      return;
    }
    try {
      await apiFetch(`/rate-limits/override/${encodeURIComponent(identifier)}`, {
        method: 'DELETE',
      });
      setMsg(`✓ Override removed for ${identifier}`);
      setIdentifier('');
    } catch {
      setMsg('Failed to remove override');
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-800 mb-1">Per-User / IP Override</h3>
      <p className="text-xs text-gray-500 mb-3">
        Set a custom requests-per-minute limit for any user ID or IP. Overrides last 24 hours.
      </p>

      <div className="space-y-2">
        <input
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="User ID or IP address"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <input
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Requests per minute (e.g. 500)"
          type="number"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            onClick={setOverride}
            className="flex-1 bg-blue-600 text-white py-1.5 rounded text-sm hover:bg-blue-700"
          >
            Set Override
          </button>
          <button
            onClick={removeOverride}
            className="flex-1 border border-gray-300 text-gray-700 py-1.5 rounded text-sm hover:bg-gray-50"
          >
            Remove Override
          </button>
        </div>
      </div>

      {msg && <p className="text-sm mt-2 text-blue-700">{msg}</p>}
    </div>
  );
}

function UnblockPanel({ autoblocked, onUnblock }) {
  const [ip, setIp] = useState('');
  const [msg, setMsg] = useState('');

  async function unblock(target) {
    const targetIp = target || ip.trim();
    if (!targetIp) {
      setMsg('IP required');
      return;
    }
    try {
      await apiFetch('/rate-limits/unblock', {
        method: 'POST',
        body: JSON.stringify({ ip: targetIp }),
      });
      setMsg(`✓ ${targetIp} unblocked`);
      setIp('');
      onUnblock();
    } catch {
      setMsg('Failed to unblock');
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-800 mb-1">Auto-blocked IPs</h3>
      <p className="text-xs text-gray-500 mb-3">
        IPs automatically blocked for exceeding abuse threshold. Blocks expire after 1 hour.
      </p>

      {autoblocked.length === 0 ? (
        <p className="text-gray-400 text-sm italic mb-3">No auto-blocked IPs.</p>
      ) : (
        <ul className="space-y-1 mb-3 max-h-32 overflow-y-auto">
          {autoblocked.map(({ ip: blockedIp }) => (
            <li
              key={blockedIp}
              className="flex items-center justify-between bg-red-50 rounded px-3 py-1.5 text-sm font-mono"
            >
              <span className="text-red-700">{blockedIp}</span>
              <button
                onClick={() => unblock(blockedIp)}
                className="text-blue-600 hover:text-blue-800 text-xs"
              >
                Unblock
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Manual unblock by IP"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && unblock()}
        />
        <button
          onClick={() => unblock()}
          className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700"
        >
          Unblock
        </button>
      </div>
      {msg && <p className="text-sm mt-2 text-blue-700">{msg}</p>}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function RateLimitMonitor() {
  const [status, setStatus] = useState(null);
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview'); // overview | violations | controls
  const [lastRefresh, setLastRefresh] = useState(null);

  const loadStatus = useCallback(async () => {
    try {
      const [s, v] = await Promise.all([
        apiFetch('/rate-limits/status'),
        apiFetch('/rate-limits/violations?limit=100'),
      ]);
      setStatus(s);
      setViolations(v.data || []);
      setLastRefresh(new Date());
      setError('');
    } catch (err) {
      setError('Failed to load rate limit data. ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();

    let socket = null;
    let heartbeat = null;

    try {
      if (typeof window !== 'undefined') {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        socket = new WebSocket(`${wsProtocol}//${window.location.host}/api/ws/rate-limits`);

        const clearHeartbeat = () => {
          if (heartbeat) {
            clearInterval(heartbeat);
            heartbeat = null;
          }
        };

        socket.onopen = () => {
          clearHeartbeat();
          heartbeat = setInterval(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: 'ping' }));
            }
          }, 15000);
        };

        socket.onerror = () => clearHeartbeat();
        socket.onclose = () => clearHeartbeat();

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data?.type === 'status_update' && data?.status) {
              setStatus(data.status);
            }
          } catch {
            // Ignore parse errors
          }
        };
      }
    } catch {
      // Fallback if WS unavailable
    }

    return () => {
      if (heartbeat) clearInterval(heartbeat);
      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close(1000, 'Component unmounted');
        }
      }
    };
  }, [loadStatus]);

  useLogoutAwareInterval(loadStatus, 30_000);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'violations', label: 'Violations' },
    { id: 'controls', label: 'Admin Controls' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rate Limit Monitor</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Live API throttling status ·{' '}
            {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : 'Loading…'}
          </p>
        </div>
        <button
          onClick={loadStatus}
          className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-50"
        >
          ↺ Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Rate-limit Keys" value={status?.totalActiveKeys} color="blue" />
        <StatCard label="Auto-blocked IPs" value={status?.autoblocked?.length} color="red" />
        <StatCard
          label="Top Endpoint Hits"
          value={status?.topEndpoints?.[0]?.count}
          sub={status?.topEndpoints?.[0]?.endpoint}
          color="yellow"
        />
        <StatCard
          label="Redis"
          value={status?.redisConnected ? '● Connected' : '○ In-memory'}
          color={status?.redisConnected ? 'green' : 'yellow'}
        />
      </div>

      {/* tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
              tab === t.id
                ? 'bg-white border border-b-white border-gray-200 text-blue-600 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-400 text-sm">Loading…</p>}

      {/* ── overview tab ────────────────────────────────────────────────────── */}
      {!loading && tab === 'overview' && status && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* top users */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Top Rate-limited Identifiers</h3>
            {status.topUsers.length === 0 ? (
              <p className="text-gray-400 text-sm italic">No data yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b">
                    <th className="pb-2">Identifier</th>
                    <th className="pb-2 text-right">Requests</th>
                  </tr>
                </thead>
                <tbody>
                  {status.topUsers.map(({ identifier, count }) => (
                    <tr key={identifier} className="border-b border-gray-50">
                      <td className="py-1.5 font-mono text-xs text-gray-700 truncate max-w-[200px]">
                        {identifier}
                      </td>
                      <td className="py-1.5 text-right">
                        <Badge color={count > 100 ? 'red' : count > 50 ? 'yellow' : 'gray'}>
                          {count}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* endpoint distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Endpoint Distribution</h3>
            {status.topEndpoints.length === 0 ? (
              <p className="text-gray-400 text-sm italic">No data yet.</p>
            ) : (
              <ul className="space-y-2">
                {status.topEndpoints.slice(0, 10).map(({ endpoint, count }) => {
                  const total = status.topEndpoints.reduce((s, e) => s + e.count, 0) || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <li key={endpoint}>
                      <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                        <span className="font-mono truncate max-w-[200px]">{endpoint}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ── violations tab ──────────────────────────────────────────────────── */}
      {!loading && tab === 'violations' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Identifier', 'Endpoint', 'Count', 'TTL (s)', 'Last seen'].map((h) => (
                  <th key={h} className="text-left text-xs text-gray-500 font-medium px-4 py-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {violations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 italic py-8 text-sm">
                    No violations recorded.
                  </td>
                </tr>
              ) : (
                violations.map((v, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs text-gray-700">{v.identifier}</td>
                    <td className="px-4 py-2 text-gray-600">{v.endpoint}</td>
                    <td className="px-4 py-2">
                      <Badge color={v.count > 100 ? 'red' : v.count > 50 ? 'yellow' : 'gray'}>
                        {v.count}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-gray-500">{v.ttlSeconds}s</td>
                    <td className="px-4 py-2 text-gray-400 text-xs">
                      {new Date(v.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── controls tab ─────────────────────────────────────────────────────── */}
      {!loading && tab === 'controls' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            <OverridePanel />
            <UnblockPanel autoblocked={status?.autoblocked || []} onUnblock={loadStatus} />
          </div>
          <div className="space-y-5">
            <IpListManager
              title="Whitelist"
              apiPath="/whitelist"
              description="Whitelisted IPs bypass all rate limits and throttling."
            />
            <IpListManager
              title="Blacklist"
              apiPath="/blacklist"
              description="Blacklisted IPs receive a 403 Forbidden on every request."
            />
          </div>
        </div>
      )}
    </div>
  );
}
