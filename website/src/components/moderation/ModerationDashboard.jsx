import { useState, useEffect, useCallback } from 'react';
import { buildUrl } from '../../utils/runtimeConfig';
import useFocusTrap from '../../hooks/useFocusTrap';

const pageStyle = {
  padding: '24px',
  background: '#0A0A0A',
  minHeight: '100vh',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const cardStyle = {
  background: '#1A1A1A',
  border: '1px solid #2A2A2A',
  borderRadius: '12px',
  padding: '20px',
};

const buttonStyle = (variant = 'primary') => ({
  padding: '8px 16px',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '500',
  background:
    variant === 'primary'
      ? '#CC1111'
      : variant === 'success'
        ? '#10B981'
        : variant === 'warning'
          ? '#F59E0B'
          : variant === 'danger'
            ? '#EF4444'
            : variant === 'purple'
              ? '#8B5CF6'
              : '#2A2A2A',
  color: 'white',
});

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #2A2A2A',
  background: '#0F0F0F',
  color: '#FFFFFF',
  fontSize: '14px',
  outline: 'none',
  marginBottom: '12px',
  boxSizing: 'border-box',
};

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
};

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '500',
  color: '#9CA3AF',
  marginBottom: '6px',
};

const FLAG_TYPES = ['spam', 'hate_speech', 'harassment', 'inappropriate', 'off_topic', 'other'];

const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'];

const RESOLUTIONS = ['approved', 'removed', 'warned', 'banned'];

const MODAL_OVERLAY = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const MODAL_STYLE = {
  background: '#1A1A1A',
  borderRadius: '16px',
  padding: '32px',
  maxWidth: '560px',
  width: '90%',
  maxHeight: '80vh',
  overflow: 'auto',
  border: '1px solid #2A2A2A',
};
import { moderationService, REPUTATION } from '../../services/moderationService';

export default function ModerationDashboard() {
  const [flags, setFlags] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    escalated: 0,
    approved: 0,
    removed: 0,
    warned: 0,
    banned: 0,
  });
  const [selectedTab, setSelectedTab] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState(null);

  const reportModalRef = useFocusTrap(showReportModal, () => setShowReportModal(false));
  const resolveModalRef = useFocusTrap(showResolveModal, () => setShowResolveModal(false));
  const noteModalRef = useFocusTrap(showNoteModal, () => setShowNoteModal(false));

  const [reportForm, setReportForm] = useState({
    contentType: 'comment',
    contentId: '',
    contentPreview: '',
    userId: '',
    flagType: 'spam',
    reason: '',
  });

  const [resolveForm, setResolveForm] = useState({
    resolution: 'approved',
    note: '',
  });

  const [noteForm, setNoteForm] = useState({
    targetType: 'flag',
    targetId: '',
    note: '',
  });

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildUrl(`/api/moderation/flags?status=${selectedTab}`));
      if (!res.ok) throw new Error('Failed to fetch flags');
      const data = await res.json();
      setFlags(data.flags || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedTab]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(buildUrl('/api/moderation/stats'));
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
    fetchStats();
  }, [fetchFlags, fetchStats]);

  const handleReport = async () => {
    try {
      const res = await fetch(buildUrl('/api/reports'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportForm),
      });
      if (!res.ok) throw new Error('Failed to report content');
      setShowReportModal(false);
      setReportForm({
        contentType: 'comment',
        contentId: '',
        contentPreview: '',
        userId: '',
        flagType: 'spam',
        reason: '',
      });
      fetchFlags();
      fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResolve = async () => {
    if (!selectedFlag) return;
    try {
      const res = await fetch(buildUrl(`/api/moderation/flags/${selectedFlag.id}/resolve`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resolveForm),
      });
      if (!res.ok) throw new Error('Failed to resolve flag');
      setShowResolveModal(false);
      setSelectedFlag(null);
      setResolveForm({ resolution: 'approved', note: '' });
      fetchFlags();
      fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddNote = async () => {
    try {
      const res = await fetch(buildUrl('/api/moderation/notes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteForm),
      });
      if (!res.ok) throw new Error('Failed to add note');
      setShowNoteModal(false);
      setNoteForm({ targetType: 'flag', targetId: '', note: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleApproveAllFromUser = async (userId) => {
    if (!window.confirm(`Approve all pending content from user ${userId}?`)) return;
    try {
      const res = await fetch(buildUrl(`/api/moderation/users/${userId}/approve-all`), {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to approve all');
      const data = await res.json();
      alert(`Approved ${data.approvedCount} items`);
      fetchFlags();
      fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };
  const loadData = () => {
    const flagged = moderationService.getFlaggedContent();
    setFlaggedContent(flagged.filter((f) => f.status === selectedTab));
    setStats({
      pending: flagged.filter((f) => f.status === 'pending').length,
      reviewed: flagged.filter((f) => f.status === 'reviewed').length,
      blocked: flagged.filter((f) => f.resolution === 'block').length,
    });
    setUserReputations(moderationService.getUserReputationSummary());
  };

  useEffect(() => {
    loadData();
  }, []);

  const getSeverityColor = (severity) => {
    const colors = {
      low: '#F59E0B',
      medium: '#F97316',
      high: '#EF4444',
      critical: '#991B1B',
    };
    return colors[severity] || '#6B7280';
  };

  const getFlagTypeColor = (type) => {
    const colors = {
      spam: '#6B7280',
      hate_speech: '#EF4444',
      harassment: '#F97316',
      inappropriate: '#F59E0B',
      off_topic: '#3B82F6',
      other: '#8B5CF6',
    };
    return colors[type] || '#6B7280';
  };

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#FFFFFF', margin: 0 }}>
            Content Moderation Dashboard
          </h1>
          <button style={buttonStyle('primary')} onClick={() => setShowReportModal(true)}>
            + Report Content
          </button>
        </div>
        <p style={{ color: '#9CA3AF', marginBottom: '32px' }}>
          Review flagged content and manage user reputations
        </p>

        {error && (
          <div
            style={{
              ...cardStyle,
              border: '1px solid #EF4444',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#EF4444' }}>{error}</span>
            <button style={buttonStyle('danger')} onClick={() => setError(null)}>
              Dismiss
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div style={cardStyle}>
            <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>Pending Review</p>
            <p
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#F59E0B',
                margin: '8px 0 0 0',
              }}
            >
              {stats.pending}
            </p>
          </div>
          <div style={cardStyle}>
            <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>Reviewed</p>
            <p
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#10B981',
                margin: '8px 0 0 0',
              }}
            >
              {stats.reviewed}
            </p>
          </div>
          <div style={cardStyle}>
            <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>Escalated</p>
            <p
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#F97316',
                margin: '8px 0 0 0',
              }}
            >
              {stats.escalated}
            </p>
          </div>
          <div style={cardStyle}>
            <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>Banned</p>
            <p
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#EF4444',
                margin: '8px 0 0 0',
              }}
            >
              {stats.banned}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
            borderBottom: '1px solid #2A2A2A',
            paddingBottom: '12px',
          }}
        >
          {['pending', 'reviewed', 'escalated'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              style={{
                ...buttonStyle(selectedTab === tab ? 'primary' : 'ghost'),
                borderRadius: '100px',
              }}
            >
              {tab[0].toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Flagged Content List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF' }}>Loading...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {flags.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: 'center', padding: '60px' }}>
                <p style={{ color: '#6B7280' }}>No flagged content to review</p>
              </div>
            ) : (
              flags.map((flag) => (
                <div
                  key={flag.id}
                  style={{
                    ...cardStyle,
                    border: `1px solid ${getSeverityColor(flag.severity)}`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '16px',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          marginBottom: '12px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            background: getSeverityColor(flag.severity),
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 500,
                          }}
                        >
                          {flag.severity?.toUpperCase()}
                        </span>
                        <span
                          style={{
                            background: getFlagTypeColor(flag.flagType),
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '11px',
                          }}
                        >
                          {flag.flagType}
                        </span>
                        <span
                          style={{
                            background: '#2A2A2A',
                            color: '#9CA3AF',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '11px',
                          }}
                        >
                          {flag.contentType}
                        </span>
                      </div>
                      <p style={{ color: '#FFFFFF', marginBottom: '12px', fontSize: '15px' }}>
                        &ldquo;{flag.contentPreview}&rdquo;
                      </p>
                      <p style={{ color: '#6B7280', fontSize: '12px' }}>
                        User: {flag.userId} &bull; {new Date(flag.createdAt).toLocaleString()}
                      </p>
                      {flag.reason && (
                        <p style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '4px' }}>
                          Reason: {flag.reason}
                        </p>
                      )}
                      {flag.resolution && (
                        <p style={{ color: '#10B981', fontSize: '12px', marginTop: '4px' }}>
                          Resolved: {flag.resolution}
                        </p>
                      )}
                    </div>
                    {flag.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          style={buttonStyle('success')}
                          onClick={() => {
                            setSelectedFlag(flag);
                            setResolveForm({ resolution: 'approved', note: '' });
                            setShowResolveModal(true);
                          }}
                        >
                          Approve
                        </button>
                        <button
                          style={buttonStyle('warning')}
                          onClick={() => {
                            setSelectedFlag(flag);
                            setResolveForm({ resolution: 'warned', note: '' });
                            setShowResolveModal(true);
                          }}
                        >
                          Warn
                        </button>
                        <button
                          style={buttonStyle('danger')}
                          onClick={() => {
                            setSelectedFlag(flag);
                            setResolveForm({ resolution: 'removed', note: '' });
                            setShowResolveModal(true);
                          }}
                        >
                          Remove
                        </button>
                        <button
                          style={buttonStyle('purple')}
                          onClick={() => handleApproveAllFromUser(flag.userId)}
                        >
                          Approve All User
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Report Content Modal */}
        {showReportModal && (
          <div
            style={MODAL_OVERLAY}
            onClick={() => setShowReportModal(false)}
            onKeyDown={(e) => e.key === 'Escape' && setShowReportModal(false)}
          >
            <div
              ref={reportModalRef}
              style={MODAL_STYLE}
              role="dialog"
              aria-modal="true"
              aria-labelledby="report-content-title"
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                id="report-content-title"
                style={{
                  margin: '0 0 24px 0',
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                }}
              >
                Report Content
              </h3>

              <label style={labelStyle}>Content Type *</label>
              <select
                style={selectStyle}
                value={reportForm.contentType}
                onChange={(e) => setReportForm({ ...reportForm, contentType: e.target.value })}
              >
                <option value="comment">Comment</option>
                <option value="post">Post</option>
                <option value="message">Message</option>
                <option value="resource">Resource</option>
              </select>

              <label style={labelStyle}>Content ID *</label>
              <input
                style={inputStyle}
                type="text"
                placeholder="ID of the content to report"
                value={reportForm.contentId}
                onChange={(e) => setReportForm({ ...reportForm, contentId: e.target.value })}
              />

              <label style={labelStyle}>Content Preview</label>
              <textarea
                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                placeholder="Brief preview of the content"
                value={reportForm.contentPreview}
                onChange={(e) => setReportForm({ ...reportForm, contentPreview: e.target.value })}
              />

              <label style={labelStyle}>User ID *</label>
              <input
                style={inputStyle}
                type="text"
                placeholder="ID of the user who posted"
                value={reportForm.userId}
                onChange={(e) => setReportForm({ ...reportForm, userId: e.target.value })}
              />

              <label style={labelStyle}>Flag Type *</label>
              <select
                style={selectStyle}
                value={reportForm.flagType}
                onChange={(e) => setReportForm({ ...reportForm, flagType: e.target.value })}
              >
                {FLAG_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ')}
                  </option>
                ))}
              </select>

              <label style={labelStyle}>Reason</label>
              <textarea
                style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
                placeholder="Explain why you're reporting this"
                value={reportForm.reason}
                onChange={(e) => setReportForm({ ...reportForm, reason: e.target.value })}
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '24px',
                }}
              >
                <button style={buttonStyle('ghost')} onClick={() => setShowReportModal(false)}>
                  Cancel
                </button>
                <button style={buttonStyle('primary')} onClick={handleReport}>
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resolve Modal */}
        {showResolveModal && selectedFlag && (
          <div
            style={MODAL_OVERLAY}
            onClick={() => setShowResolveModal(false)}
            onKeyDown={(e) => e.key === 'Escape' && setShowResolveModal(false)}
          >
            <div
              ref={resolveModalRef}
              style={MODAL_STYLE}
              role="dialog"
              aria-modal="true"
              aria-labelledby="resolve-flag-title"
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                id="resolve-flag-title"
                style={{
                  margin: '0 0 24px 0',
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                }}
              >
                Resolve Flag
              </h3>

              <label style={labelStyle}>Resolution *</label>
              <select
                style={selectStyle}
                value={resolveForm.resolution}
                onChange={(e) => setResolveForm({ ...resolveForm, resolution: e.target.value })}
              >
                {RESOLUTIONS.map((res) => (
                  <option key={res} value={res}>
                    {res[0].toUpperCase() + res.slice(1)}
                  </option>
                ))}
              </select>

              <label style={labelStyle}>Note</label>
              <textarea
                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                placeholder="Add a note about this resolution"
                value={resolveForm.note}
                onChange={(e) => setResolveForm({ ...resolveForm, note: e.target.value })}
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '24px',
                }}
              >
                <button style={buttonStyle('ghost')} onClick={() => setShowResolveModal(false)}>
                  Cancel
                </button>
                <button style={buttonStyle('primary')} onClick={handleResolve}>
                  Resolve
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Note Modal */}
        {showNoteModal && (
          <div
            style={MODAL_OVERLAY}
            onClick={() => setShowNoteModal(false)}
            onKeyDown={(e) => e.key === 'Escape' && setShowNoteModal(false)}
          >
            <div
              ref={noteModalRef}
              style={MODAL_STYLE}
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-moderator-note-title"
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                id="add-moderator-note-title"
                style={{
                  margin: '0 0 24px 0',
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                }}
              >
                Add Moderator Note
              </h3>

              <label style={labelStyle}>Target Type *</label>
              <select
                style={selectStyle}
                value={noteForm.targetType}
                onChange={(e) => setNoteForm({ ...noteForm, targetType: e.target.value })}
              >
                <option value="flag">Flag</option>
                <option value="user">User</option>
                <option value="appeal">Appeal</option>
              </select>

              <label style={labelStyle}>Target ID *</label>
              <input
                style={inputStyle}
                type="text"
                placeholder="ID of the target"
                value={noteForm.targetId}
                onChange={(e) => setNoteForm({ ...noteForm, targetId: e.target.value })}
              />

              <label style={labelStyle}>Note *</label>
              <textarea
                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                placeholder="Write your note"
                value={noteForm.note}
                onChange={(e) => setNoteForm({ ...noteForm, note: e.target.value })}
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '24px',
                }}
              >
                <button style={buttonStyle('ghost')} onClick={() => setShowNoteModal(false)}>
                  Cancel
                </button>
                <button style={buttonStyle('primary')} onClick={handleAddNote}>
                  Add Note
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
