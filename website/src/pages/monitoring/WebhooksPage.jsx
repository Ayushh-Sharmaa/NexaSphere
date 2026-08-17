import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Settings,
  Activity,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Check,
} from 'lucide-react';
import { buildUrl } from '../../utils/runtimeConfig';

const WEBHOOK_EVENTS = [
  'event.created',
  'event.updated',
  'event.cancelled',
  'user.registered',
  'user.attendance_marked',
  'certificate.issued',
  'user.joined',
  'announcement.posted',
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState([]);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const showFeedback = (message, type = 'info') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    secret: '',
    events: [],
  });

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildUrl('/api/webhooks'));
      if (!res.ok) throw new Error('Failed to fetch webhooks');
      const data = await res.json();
      setWebhooks(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const handleSelectWebhook = async (webhook) => {
    setSelectedWebhook(webhook);
    try {
      const [delResult, statsResult] = await Promise.allSettled([
        fetch(buildUrl(`/api/webhooks/${webhook.id}/deliveries`)),
        fetch(buildUrl(`/api/webhooks/${webhook.id}/stats`)),
      ]);

      if (delResult.status === 'fulfilled' && delResult.value.ok) {
        const delData = await delResult.value.json();
        setDeliveries(delData.data || []);
      }

      if (statsResult.status === 'fulfilled' && statsResult.value.ok) {
        const statsData = await statsResult.value.json();
        setStats(statsData.data || null);
      }
    } catch (err) {
      console.error('Error fetching webhook stats:', err);
    }
  };

  const handleToggleEvent = (event) => {
    setFormData((prev) => {
      const events = prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event];
      return { ...prev, events };
    });
  };

  const handleCreateWebhook = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(buildUrl('/api/webhooks'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create webhook');
      }
      setShowAddForm(false);
      setFormData({ name: '', url: '', secret: '', events: [] });
      fetchWebhooks();
    } catch (err) {
      showFeedback(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWebhook = async (id) => {
    if (!window.confirm('Are you sure you want to delete this webhook?')) return;
    try {
      const res = await fetch(buildUrl(`/api/webhooks/${id}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete webhook');
      if (selectedWebhook?.id === id) {
        setSelectedWebhook(null);
        setDeliveries([]);
        setStats(null);
      }
      fetchWebhooks();
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  const handleTestWebhook = async (id) => {
    try {
      const res = await fetch(buildUrl(`/api/webhooks/${id}/test`), { method: 'POST' });
      if (!res.ok) throw new Error('Failed to send test payload');
      showFeedback('Test webhook payload dispatched successfully!', 'success');
      if (selectedWebhook?.id === id) {
        handleSelectWebhook(selectedWebhook);
      }
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  const handleReplayDelivery = async (deliveryId) => {
    try {
      const res = await fetch(buildUrl(`/api/webhooks/deliveries/${deliveryId}/replay`), {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to replay webhook delivery');
      showFeedback('Webhook delivery replayed successfully!', 'success');
      if (selectedWebhook) {
        handleSelectWebhook(selectedWebhook);
      }
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', color: 'var(--t1)' }}>
      {feedback && (
        <div
          role="status"
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.95rem',
            fontWeight: 500,
            backgroundColor:
              feedback.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            color: feedback.type === 'error' ? '#f87171' : '#34d399',
            border: `1px solid ${feedback.type === 'error' ? '#ef4444' : '#10b981'}`,
          }}
        >
          {feedback.message}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '2.2rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: 0,
            }}
          >
            <Activity color="var(--c1)" size={32} />
            Webhook Integrations
          </h1>
          <p style={{ color: 'var(--t2)', marginTop: '8px' }}>
            Configure HTTP callbacks to receive real-time updates when events happen in NexaSphere.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            background: 'var(--c1)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 20px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'transform 0.2s',
          }}
        >
          <Plus size={18} /> Add Webhook
        </button>
      </div>

      {showAddForm && (
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(204,17,17,0.25)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px',
          }}
        >
          <h2
            style={{
              fontSize: '1.25rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Settings size={20} /> Register New Webhook
          </h2>
          <form onSubmit={handleCreateWebhook}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '16px',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '0.85rem',
                    color: 'var(--t2)',
                  }}
                >
                  Webhook Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Discord Alerts"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '0.85rem',
                    color: 'var(--t2)',
                  }}
                >
                  Payload URL (HTTPS required)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://your-api.com/webhooks"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '0.85rem',
                  color: 'var(--t2)',
                }}
              >
                Subscribe to Events
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '10px',
                }}
              >
                {WEBHOOK_EVENTS.map((event) => {
                  const active = formData.events.includes(event);
                  return (
                    <button
                      type="button"
                      key={event}
                      onClick={() => handleToggleEvent(event)}
                      style={{
                        background: active ? 'rgba(204,17,17,0.15)' : 'rgba(255,255,255,0.03)',
                        border: active ? '1px solid var(--c1)' : '1px solid rgba(255,255,255,0.08)',
                        color: active ? '#fff' : 'var(--t2)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '0.8rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      {event}
                      {active && <Check size={14} color="var(--c1)" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                style={{
                  background: 'none',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'var(--t2)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: 'var(--c1)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {submitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px' }}>
        {/* Left column — list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>
            Active Configurations
          </h3>
          {loading && <p>Loading webhooks...</p>}
          {error && <p style={{ color: 'var(--c1)' }}>{error}</p>}
          {!loading && webhooks.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '32px',
                color: 'var(--t2)',
                border: '1px dashed rgba(255,255,255,0.1)',
                borderRadius: '12px',
              }}
            >
              No webhooks registered yet.
            </div>
          )}
          {webhooks.map((wh) => {
            const isSelected = selectedWebhook?.id === wh.id;
            return (
              <div
                key={wh.id}
                onClick={() => handleSelectWebhook(wh)}
                style={{
                  background: isSelected ? 'rgba(204,17,17,0.08)' : 'rgba(255,255,255,0.02)',
                  border: isSelected ? '1px solid var(--c1)' : '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{wh.name}</span>
                  <span
                    style={{
                      background: wh.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(150,150,150,0.15)',
                      color: wh.isActive ? '#22c55e' : '#999',
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: '8px',
                    }}
                  >
                    {wh.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--t2)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginBottom: '12px',
                  }}
                >
                  {wh.url}
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestWebhook(wh.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9999ff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                    }}
                  >
                    <Send size={12} /> Test
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteWebhook(wh.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ff5555',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                    }}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right column — details and logs */}
        <div
          style={{
            background: 'rgba(255,255,255,0.01)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '24px',
            minHeight: '400px',
          }}
        >
          {selectedWebhook ? (
            <div>
              <div
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  paddingBottom: '16px',
                  marginBottom: '20px',
                }}
              >
                <h3 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '4px' }}>
                  {selectedWebhook.name}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--t2)' }}>
                  Endpoint: {selectedWebhook.url}
                </p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  {selectedWebhook.events.map((e) => (
                    <span
                      key={e}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px',
                        padding: '2px 8px',
                        fontSize: '0.7rem',
                        color: 'var(--t2)',
                      }}
                    >
                      {e}
                    </span>
                  ))}
                </div>
              </div>

              {stats && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '16px',
                    marginBottom: '24px',
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(34,197,94,0.06)',
                      border: '1px solid rgba(34,197,94,0.15)',
                      borderRadius: '10px',
                      padding: '12px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: 'var(--t2)' }}>
                      Successful Deliveries
                    </div>
                    <div
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: '#22c55e',
                        marginTop: '4px',
                      }}
                    >
                      {stats.success}
                    </div>
                  </div>
                  <div
                    style={{
                      background: 'rgba(239,68,68,0.06)',
                      border: '1px solid rgba(239,68,68,0.15)',
                      borderRadius: '10px',
                      padding: '12px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: 'var(--t2)' }}>Failed Deliveries</div>
                    <div
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: '#ef4444',
                        marginTop: '4px',
                      }}
                    >
                      {stats.failed}
                    </div>
                  </div>
                  <div
                    style={{
                      background: 'rgba(245,158,11,0.06)',
                      border: '1px solid rgba(245,158,11,0.15)',
                      borderRadius: '10px',
                      padding: '12px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: 'var(--t2)' }}>Pending Retries</div>
                    <div
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: '#f59e0b',
                        marginTop: '4px',
                      }}
                    >
                      {stats.pending}
                    </div>
                  </div>
                </div>
              )}

              <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '12px' }}>
                Recent Deliveries
              </h4>
              {deliveries.length === 0 ? (
                <p style={{ color: 'var(--t2)', fontSize: '0.9rem' }}>
                  No delivery logs available for this webhook.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {deliveries.map((del) => {
                    const isSuccess = del.status === 'success';
                    return (
                      <div
                        key={del.id}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          borderRadius: '10px',
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {isSuccess ? (
                            <CheckCircle2 color="#22c55e" size={18} />
                          ) : del.status === 'pending' ? (
                            <RefreshCw color="#f59e0b" size={18} className="spin" />
                          ) : (
                            <XCircle color="#ef4444" size={18} />
                          )}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                              {del.eventType}
                            </div>
                            <div
                              style={{ fontSize: '0.7rem', color: 'var(--t2)', marginTop: '2px' }}
                            >
                              Attempt {del.attemptCount} •{' '}
                              {new Date(del.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '0.8rem',
                              color: isSuccess ? '#22c55e' : '#ef4444',
                            }}
                          >
                            HTTP {del.responseStatus || 'N/A'}
                          </span>
                          {!isSuccess && (
                            <button
                              onClick={() => handleReplayDelivery(del.id)}
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '0.75rem',
                                color: 'var(--t1)',
                                cursor: 'pointer',
                              }}
                            >
                              Replay
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--t2)',
              }}
            >
              <Shield size={48} color="rgba(255,255,255,0.15)" style={{ marginBottom: '16px' }} />
              <p style={{ fontSize: '0.95rem' }}>
                Select a webhook from the left to view details, statistics, and delivery logs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
