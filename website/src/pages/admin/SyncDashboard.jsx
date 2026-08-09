import React, { useState, useEffect } from 'react';

export default function SyncDashboard({ token }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [conflicts, setConflicts] = useState(null);
  const [forceSyncing, setForceSyncing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const base = (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '');
      const [statusRes, conflictsRes] = await Promise.all([
        fetch(`${base}/api/admin/sync-status`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${base}/api/admin/conflicts`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const statusData = await statusRes.json();
      const conflictsData = await conflictsRes.json();

      if (!statusRes.ok) throw new Error(statusData.error || 'Failed to fetch status');
      if (!conflictsRes.ok) throw new Error(conflictsData.error || 'Failed to fetch conflicts');

      setSyncStatus(statusData.data);
      setConflicts(conflictsData.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleForceSync = async () => {
    try {
      setForceSyncing(true);
      const base = (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '');
      const res = await fetch(`${base}/api/admin/sync/force`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to force sync');
      alert(data.data.message);
      await fetchData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setForceSyncing(false);
    }
  };

  if (loading) return <div style={{ color: 'white' }}>Loading Database Sync Dashboard...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div
      style={{ padding: '2rem', background: '#1e293b', borderRadius: '16px', color: 'var(--t1)' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <h2 style={{ margin: 0, color: 'white' }}>Database Sync Status</h2>
        <button className="btn btn-primary" onClick={handleForceSync} disabled={forceSyncing}>
          {forceSyncing ? 'Syncing...' : 'Force Sync All Nodes'}
        </button>
      </div>

      {syncStatus?.metrics && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px' }}
          >
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--t2)' }}>Average Delay</h4>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {syncStatus.metrics.averageDelayMs} ms
            </div>
          </div>
          <div
            style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px' }}
          >
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--t2)' }}>Pending Changes</h4>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {syncStatus.metrics.totalPendingChanges}
            </div>
          </div>
          <div
            style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px' }}
          >
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--t2)' }}>Conflicting Records</h4>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: syncStatus.metrics.conflictingRecords > 0 ? '#ef4444' : '#10b981',
              }}
            >
              {syncStatus.metrics.conflictingRecords}
            </div>
          </div>
          <div
            style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px' }}
          >
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--t2)' }}>Last Successful Sync</h4>
            <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>
              {new Date(syncStatus.metrics.lastSuccessfulSync).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      <h3 style={{ marginBottom: '1rem' }}>Distributed Nodes Status</h3>
      <div
        style={{
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '2rem',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
              <th style={{ padding: '1rem' }}>Node ID</th>
              <th style={{ padding: '1rem' }}>Region</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Delay (ms)</th>
              <th style={{ padding: '1rem' }}>Pending Changes</th>
            </tr>
          </thead>
          <tbody>
            {syncStatus?.nodes?.map((node) => (
              <tr key={node.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{node.id}</td>
                <td style={{ padding: '1rem' }}>{node.region}</td>
                <td
                  style={{
                    padding: '1rem',
                    color: node.status === 'ONLINE' ? '#10b981' : '#f59e0b',
                    fontWeight: 'bold',
                  }}
                >
                  {node.status}
                </td>
                <td style={{ padding: '1rem' }}>{node.delayMs}</td>
                <td style={{ padding: '1rem' }}>{node.pendingChanges}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginBottom: '1rem' }}>Conflicting Records</h3>
      {conflicts?.conflicts?.length > 0 ? (
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '1rem' }}>Table</th>
                <th style={{ padding: '1rem' }}>Record ID</th>
                <th style={{ padding: '1rem' }}>Conflict Type</th>
                <th style={{ padding: '1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {conflicts.conflicts.map((conflict) => (
                <tr key={conflict.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{conflict.table}</td>
                  <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{conflict.recordId}</td>
                  <td style={{ padding: '1rem', color: '#ef4444' }}>{conflict.conflictType}</td>
                  <td style={{ padding: '1rem' }}>
                    {conflict.resolved ? 'Resolved' : 'Pending Action'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ color: 'var(--t2)' }}>No conflicting records found.</p>
      )}
    </div>
  );
}
