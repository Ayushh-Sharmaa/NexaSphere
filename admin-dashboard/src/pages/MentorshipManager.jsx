import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { AdminIcon } from '../components/AdminIcon';
import { Skeleton } from '../components/Skeleton';

const statusColors = {
  pending: 'status-badge-warning',
  active: 'status-badge-success',
  completed: 'status-badge-info',
  rejected: 'status-badge-danger',
};

export function MentorshipManager() {
  const [mentorships, setMentorships] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('mentorships');
  const [activeTab, setActiveTab] = useState('all');
  const [updating, setUpdating] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [msData, mData] = await Promise.all([
        api.mentorship.getAll({ limit: 100 }),
        api.mentorship.getMentors({ limit: 100 }),
      ]);
      setMentorships(msData?.mentorships ?? []);
      setMentors(mData?.mentors ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.mentorship.updateStatus(id, status);
      setMentorships((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    } catch (e) {
      setError(e.message);
    } finally {
      setUpdating(null);
    }
  };

  const filteredMentorships =
    activeTab === 'all' ? mentorships : mentorships.filter((m) => m.status === activeTab);

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <h2 className="page-title">Mentorship Management</h2>
        </div>
        <Skeleton lines={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="page-header">
          <h2 className="page-title">Mentorship Management</h2>
        </div>
        <div className="page-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Mentorship Management</h2>
        <div className="page-header-actions">
          <button
            className={`btn btn-sm ${tab === 'mentorships' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('mentorships')}
          >
            Mentorships ({mentorships.length})
          </button>
          <button
            className={`btn btn-sm ${tab === 'mentors' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('mentors')}
          >
            Mentors ({mentors.length})
          </button>
        </div>
      </div>

      {tab === 'mentorships' && (
        <>
          <div className="tabs" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {['all', 'pending', 'active', 'completed', 'rejected'].map((s) => (
              <button
                key={s}
                className={`btn btn-sm ${activeTab === s ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {filteredMentorships.length === 0 ? (
            <div className="empty-state">No mentorships found.</div>
          ) : (
            <div className="list">
              {filteredMentorships.map((m) => (
                <div key={m.id} className="list-item">
                  <div className="list-item-left">
                    <div className="item-name">
                      {m.mentorName} ↔ {m.menteeName}
                    </div>
                    <div className="item-meta">
                      {m.menteeDomain && <span>Domain: {m.menteeDomain} · </span>}
                      {m.menteeEmail} · {m.sessionCount || 0} sessions
                      {m.menteeGoals && (
                        <>
                          <br />
                          Goals: {m.menteeGoals}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="list-item-right">
                    <span className={`status-badge ${statusColors[m.status] || ''}`}>
                      {m.status}
                    </span>
                    {m.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                        <button
                          className="btn-icon"
                          title="Approve"
                          onClick={() => handleStatus(m.id, 'active')}
                          disabled={updating === m.id}
                        >
                          {updating === m.id ? '…' : <AdminIcon name="Check" size={16} />}
                        </button>
                        <button
                          className="btn-icon danger"
                          title="Reject"
                          onClick={() => handleStatus(m.id, 'rejected')}
                          disabled={updating === m.id}
                        >
                          {updating === m.id ? '…' : <AdminIcon name="X" size={16} />}
                        </button>
                      </div>
                    )}
                    {m.status === 'active' && (
                      <button
                        className="btn btn-sm btn-secondary"
                        style={{ marginLeft: '8px' }}
                        onClick={() => handleStatus(m.id, 'completed')}
                        disabled={updating === m.id}
                      >
                        {updating === m.id ? 'Completing…' : 'Mark Complete'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'mentors' && (
        <>
          {mentors.length === 0 ? (
            <div className="empty-state">No mentors registered.</div>
          ) : (
            <div className="list">
              {mentors.map((m) => (
                <div key={m.id} className="list-item">
                  <div className="list-item-left">
                    <div className="item-name">{m.name}</div>
                    <div className="item-meta">
                      {m.email} · {m.experience || 'N/A'} exp · {m.menteeCount || 0} mentees
                      {m.domains?.length > 0 && <> · Domains: {m.domains.join(', ')}</>}
                    </div>
                  </div>
                  <div className="list-item-right">
                    <span
                      className={`status-badge ${m.isAvailable ? 'status-badge-success' : 'status-badge-muted'}`}
                    >
                      {m.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
