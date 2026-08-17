import React, { useState, useEffect } from 'react';

export default function PortfolioModerationQueue({ token }) {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const showFeedback = (message, type = 'error') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };
  const [rejectReason, setRejectReason] = useState('');
  const [activeReject, setActiveReject] = useState(null);

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      const base = (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '');
      const res = await fetch(`${base}/moderation/portfolios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.data.portfolios) {
        setPortfolios(data.data.portfolios);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, [token]);

  const handleAction = async (username, action) => {
    try {
      setActionLoading(username);
      const base = (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '');
      const payload = action === 'reject' ? { reason: rejectReason } : {};

      const res = await fetch(`${base}/moderation/portfolios/${username}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(`Portfolio ${action}ed successfully!`);
        setActiveReject(null);
        setRejectReason('');
        fetchPortfolios();
      } else {
        alert(`Failed to ${action} portfolio`);
      }
    } catch (err) {
      console.error(err);
      showFeedback('An error occurred', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div>Loading Moderation Queue...</div>;

  return (
    <div
      style={{ padding: '2rem', background: '#1e293b', borderRadius: '16px', color: 'var(--t1)' }}
    >
      <h2>Portfolio Moderation Queue</h2>
      <p style={{ color: 'var(--t2)', marginBottom: '2rem' }}>
        Review flagged user portfolios before they appear publicly.
      </p>

      {portfolios.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
          }}
        >
          <h3>No Flagged Portfolios</h3>
          <p style={{ color: 'var(--t2)' }}>The moderation queue is currently empty.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {portfolios.map((p) => (
            <div
              key={p.username}
              style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '1.5rem',
                borderRadius: '8px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>{p.username}</h3>
                  <div style={{ fontSize: '0.9rem', color: 'var(--t2)' }}>
                    <strong>Title:</strong> {p.title || 'N/A'}
                    <br />
                    <strong>Bio:</strong> {p.bio || 'N/A'}
                    <br />
                    <strong style={{ color: '#ef4444' }}>Flag Reason:</strong>{' '}
                    {p.flag_reason || 'Manual Flag'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleAction(p.username, 'approve')}
                    disabled={actionLoading === p.username}
                    style={{ background: '#10b981', borderColor: '#10b981' }}
                  >
                    Approve
                  </button>

                  <button
                    className="btn btn-primary"
                    onClick={() => setActiveReject(p.username)}
                    disabled={actionLoading === p.username}
                    style={{ background: '#ef4444', borderColor: '#ef4444' }}
                  >
                    Reject
                  </button>
                </div>
              </div>

              {activeReject === p.username && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '4px',
                  }}
                >
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Reason for Rejection
                  </label>
                  <textarea
                    className="input-field"
                    style={{ width: '100%', minHeight: '80px', marginBottom: '1rem' }}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Explain why this portfolio is being rejected..."
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button className="btn" onClick={() => setActiveReject(null)}>
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ background: '#ef4444', borderColor: '#ef4444' }}
                      onClick={() => handleAction(p.username, 'reject')}
                    >
                      Confirm Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
