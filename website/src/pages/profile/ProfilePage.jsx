import { useState, useEffect } from 'react';
import { useUnsavedChangesWarning } from '../../hooks/useUnsavedChangesWarning';
import BadgesList from '../../components/profile/BadgesList';
import ProfileProgressBar from '../../components/profile/ProfileProgressBar';
import GitHubStats from '../../components/profile/GitHubStats';
import { Skeleton, SkeletonAvatar, SkeletonText } from '../../components/ui/skeleton/Skeleton';
const styles = {
  page: {
    minHeight: '100vh',
    background: '#0f172a',
    color: '#f0f4ff',
    fontFamily: 'system-ui, sans-serif',
    padding: '2rem 1rem',
  },
  container: { maxWidth: '900px', margin: '0 auto' },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '1rem',
  },
  header: {
    background: '#1e293b',
    borderRadius: '16px',
    padding: '2rem',
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
    border: '1px solid #ffffff0f',
    flexWrap: 'wrap',
  },
  avatar: { width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' },
  avatarFallback: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: '#3b82f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    fontWeight: '900',
    color: '#fff',
  },
  headerInfo: { flex: 1 },
  name: { fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.3rem' },
  email: { color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.3rem' },
  bio: { color: '#cbd5e1', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: '1.6' },
  joinDate: { color: '#64748b', fontSize: '0.8rem', marginTop: '0.3rem' },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  statCard: {
    background: '#1e293b',
    border: '1px solid #ffffff0f',
    borderRadius: '12px',
    padding: '1.2rem',
    textAlign: 'center',
  },
  statNum: { fontSize: '2rem', fontWeight: '900', color: '#3b82f6', display: 'block' },
  statLabel: { fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  tab: {
    padding: '0.55rem 1.2rem',
    borderRadius: '8px',
    border: '1px solid #ffffff15',
    background: 'transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '0.88rem',
    transition: 'all 0.2s',
  },
  tabActive: {
    padding: '0.55rem 1.2rem',
    borderRadius: '8px',
    border: '1px solid #3b82f6',
    background: '#3b82f620',
    color: '#3b82f6',
    cursor: 'pointer',
    fontSize: '0.88rem',
    fontWeight: '700',
  },
  panel: {
    background: '#1e293b',
    border: '1px solid #ffffff0f',
    borderRadius: '12px',
    padding: '1.5rem',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    padding: '0.7rem 1rem',
    fontSize: '0.8rem',
    color: '#64748b',
    borderBottom: '1px solid #ffffff0f',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  td: {
    padding: '0.85rem 1rem',
    fontSize: '0.88rem',
    borderBottom: '1px solid #ffffff07',
    verticalAlign: 'middle',
  },
  badge: {
    display: 'inline-block',
    padding: '0.2rem 0.65rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '700',
  },
  btnPrimary: {
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    padding: '0.65rem 1.4rem',
    borderRadius: '8px',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  btnOutline: {
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid #ffffff20',
    padding: '0.65rem 1.4rem',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  input: {
    width: '100%',
    background: '#0f172a',
    border: '1px solid #ffffff20',
    color: '#f0f4ff',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    marginBottom: '1rem',
    outline: 'none',
    fontFamily: 'inherit',
  },
  label: {
    display: 'block',
    fontSize: '0.8rem',
    color: '#64748b',
    marginBottom: '0.3rem',
    letterSpacing: '0.05em',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: '#000000bb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modal: {
    background: '#1e293b',
    border: '1px solid #ffffff15',
    borderRadius: '16px',
    padding: '2rem',
    width: '100%',
    maxWidth: '480px',
  },
  modalTitle: { fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem' },
  modalBtns: { display: 'flex', gap: '0.8rem', justifyContent: 'flex-end', marginTop: '0.5rem' },
  empty: { textAlign: 'center', padding: '3rem', color: '#64748b' },
  socialLink: {
    color: '#3b82f6',
    textDecoration: 'none',
    fontSize: '0.85rem',
    marginRight: '0.8rem',
  },
  forumItem: { padding: '0.9rem 0', borderBottom: '1px solid #ffffff07' },
  forumTitle: { fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.3rem' },
  forumMeta: { fontSize: '0.78rem', color: '#64748b' },
  achieveBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    background: '#f59e0b18',
    border: '1px solid #f59e0b30',
    color: '#f59e0b',
    padding: '0.4rem 0.9rem',
    borderRadius: '8px',
    fontSize: '0.82rem',
    margin: '0.3rem',
  },
};

const statusColor = (s) =>
  s === 'attended' ? '#10b981' : s === 'cancelled' ? '#ef4444' : '#3b82f6';
const statusBg = (s) =>
  s === 'attended' ? '#10b98118' : s === 'cancelled' ? '#ef444418' : '#3b82f618';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('registrations');
  const [editForm, setEditForm] = useState({
    fullName: '',
    bio: '',
    socialLinks: { github: '', linkedin: '', portfolio: '' },
  });

  const isDirty =
    editing &&
    profile &&
    (editForm.fullName !== (profile.fullName || profile.name || '') ||
      editForm.bio !== (profile.bio || '') ||
      JSON.stringify(editForm.socialLinks) !==
        JSON.stringify(profile.socialLinks || { github: '', linkedin: '', portfolio: '' }));
  useUnsavedChangesWarning(isDirty);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/profile', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();
      setProfile(data);
      setEditForm({
        fullName: data.fullName || data.name || '',
        bio: data.bio || '',
        socialLinks: data.socialLinks || { github: '', linkedin: '', portfolio: '' },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const updated = await res.json();
      setProfile((prev) => ({ ...prev, ...updated }));
      setEditing(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.header}>
            <SkeletonAvatar size={80} />
            <div style={styles.headerInfo}>
              <Skeleton width="40%" height="1.5rem" />
              <div style={{ height: 8 }} />
              <Skeleton width="58%" height="0.9rem" />
              <div style={{ height: 12 }} />
              <SkeletonText lines={2} lastLineWidth="72%" />
            </div>
          </div>

          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <Skeleton width="48%" height="2rem" />
              <div style={{ height: 8 }} />
              <Skeleton width="60%" height="0.8rem" />
            </div>
            <div style={styles.statCard}>
              <Skeleton width="48%" height="2rem" />
              <div style={{ height: 8 }} />
              <Skeleton width="60%" height="0.8rem" />
            </div>
            <div style={styles.statCard}>
              <Skeleton width="48%" height="2rem" />
              <div style={{ height: 8 }} />
              <Skeleton width="60%" height="0.8rem" />
            </div>
            <div style={styles.statCard}>
              <Skeleton width="48%" height="2rem" />
              <div style={{ height: 8 }} />
              <Skeleton width="60%" height="0.8rem" />
            </div>
          </div>

          <div style={styles.tabs}>
            <Skeleton width="88px" height="2.2rem" />
            <Skeleton width="78px" height="2.2rem" />
            <Skeleton width="96px" height="2.2rem" />
            <Skeleton width="102px" height="2.2rem" />
          </div>

          <div style={styles.statCard}>
            <SkeletonText lines={4} lastLineWidth="66%" />
          </div>
        </div>
      </div>
    );
  if (error)
    return (
      <div style={styles.center}>
        <p style={{ color: '#ef4444' }}>Error: {error}</p>
        <button onClick={fetchProfile} style={styles.btnPrimary}>
          Retry
        </button>
      </div>
    );

  const tabs = ['registrations', 'forum', 'mentorship', 'achievements'];

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            {profile.avatar ? (
              <img src={profile.avatar} alt="avatar" style={styles.avatar} />
            ) : (
              <div style={styles.avatarFallback}>
                {(profile.fullName || profile.name || 'U')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div style={styles.headerInfo}>
            <div style={styles.name}>{profile.fullName || profile.name}</div>
            <div style={styles.email}>{profile.email}</div>
            {profile.bio && <div style={styles.bio}>{profile.bio}</div>}
            <div style={styles.joinDate}>
              Joined{' '}
              {new Date(profile.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
              })}
              &nbsp;&bull;&nbsp;{profile.role || 'Student'}
            </div>
            <div
              style={{ marginTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <BadgesList />
            </div>
            {profile.socialLinks && (
              <div style={{ marginTop: '0.6rem' }}>
                {profile.socialLinks.github && (
                  <a
                    href={profile.socialLinks.github}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.socialLink}
                  >
                    GitHub
                  </a>
                )}
                {profile.socialLinks.linkedin && (
                  <a
                    href={profile.socialLinks.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.socialLink}
                  >
                    LinkedIn
                  </a>
                )}
                {profile.socialLinks.portfolio && (
                  <a
                    href={profile.socialLinks.portfolio}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.socialLink}
                  >
                    Portfolio
                  </a>
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button onClick={() => setEditing(true)} style={styles.btnOutline}>
              Edit Profile
            </button>
            <button
              onClick={() => navigate('/settings/account')}
              style={{ ...styles.btnOutline, background: '#1e293b' }}
            >
              Manage Account & Privacy
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <span
              style={{
                ...styles.statNum,
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              {profile.stats?.currentStreak ?? profile.stats?.streak ?? 0} 🔥
            </span>
            <div style={styles.statLabel}>Day Streak</div>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNum}>{profile.stats?.totalRegistrations ?? 0}</span>
            <div style={styles.statLabel}>Registrations</div>
          </div>
          <div style={styles.statCard}>
            <span style={{ ...styles.statNum, color: '#10b981' }}>
              {profile.stats?.attendedEvents ?? 0}
            </span>
            <div style={styles.statLabel}>Events Attended</div>
          </div>
          <div style={styles.statCard}>
            <span style={{ ...styles.statNum, color: '#f59e0b' }}>
              {profile.stats?.forumPosts ?? 0}
            </span>
            <div style={styles.statLabel}>Forum Posts</div>
          </div>
          <div style={styles.statCard}>
            <span style={{ ...styles.statNum, color: '#8b5cf6' }}>
              {profile.stats?.mentorSessions ?? 0}
            </span>
            <div style={styles.statLabel}>Mentor Sessions</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={activeTab === t ? styles.tabActive : styles.tab}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Panels */}
        <div style={styles.panel}>
          {/* Registrations */}
          {activeTab === 'registrations' &&
            (profile.registrations?.length ? (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Event</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.registrations.map((r, i) => (
                    <tr key={i}>
                      <td style={styles.td}>
                        {r.eventId?.title || r.eventId?.name || 'Unknown Event'}
                      </td>
                      <td style={styles.td}>{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            background: statusBg(r.status),
                            color: statusColor(r.status),
                          }}
                        >
                          {r.status || 'registered'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={styles.empty}>No registrations yet. Explore events to get started!</div>
            ))}

          {/* Forum */}
          {activeTab === 'forum' &&
            (profile.forumActivity?.length ? (
              profile.forumActivity.map((post, i) => (
                <div key={i} style={styles.forumItem}>
                  <div style={styles.forumTitle}>
                    {post.title || post.content?.slice(0, 80) + '...'}
                  </div>
                  <div style={styles.forumMeta}>
                    {new Date(post.createdAt).toLocaleDateString()} &bull; {post.type || 'Thread'}
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.empty}>
                No forum activity yet.
                <br />
                <span style={{ fontSize: '0.85rem' }}>
                  Total posts counted: {profile.stats?.forumPosts ?? 0}
                </span>
              </div>
            ))}

          {/* Mentorship */}
          {activeTab === 'mentorship' &&
            (profile.mentorSessions?.length ? (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Mentor</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.mentorSessions.map((s, i) => (
                    <tr key={i}>
                      <td style={styles.td}>{s.mentorId?.name || s.mentorId?.email || 'Mentor'}</td>
                      <td style={styles.td}>
                        {new Date(s.date || s.createdAt).toLocaleDateString()}
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{ ...styles.badge, background: '#8b5cf618', color: '#8b5cf6' }}
                        >
                          {s.status || 'completed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={styles.empty}>
                No mentorship sessions yet.
                <br />
                <span style={{ fontSize: '0.85rem' }}>
                  Total sessions counted: {profile.stats?.mentorSessions ?? 0}
                </span>
              </div>
            ))}

          {/* Achievements */}
          {activeTab === 'achievements' &&
            (profile.achievements?.length ? (
              <div style={{ padding: '0.5rem 0' }}>
                {profile.achievements.map((a, i) => (
                  <span key={i} style={styles.achieveBadge}>
                    {a.icon || '★'} {a.title || a.name || a}
                  </span>
                ))}
              </div>
            ) : (
              <div style={styles.empty}>
                No achievements yet. Keep participating to earn badges!
              </div>
            ))}
        </div>

        {/* Edit Modal */}
        {editing && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalTitle}>Edit Profile</div>
              <label style={styles.label}>Full Name</label>
              <input
                style={styles.input}
                value={editForm.fullName}
                onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
                placeholder="Your full name"
              />
              <label style={styles.label}>Bio</label>
              <textarea
                style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                value={editForm.bio}
                onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
              />
              <label style={styles.label}>GitHub URL</label>
              <input
                style={styles.input}
                value={editForm.socialLinks?.github || ''}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    socialLinks: { ...f.socialLinks, github: e.target.value },
                  }))
                }
                placeholder="https://github.com/username"
              />
              <label style={styles.label}>LinkedIn URL</label>
              <input
                style={styles.input}
                value={editForm.socialLinks?.linkedin || ''}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    socialLinks: { ...f.socialLinks, linkedin: e.target.value },
                  }))
                }
                placeholder="https://linkedin.com/in/username"
              />
              <label style={styles.label}>Portfolio URL</label>
              <input
                style={styles.input}
                value={editForm.socialLinks?.portfolio || ''}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    socialLinks: { ...f.socialLinks, portfolio: e.target.value },
                  }))
                }
                placeholder="https://yourportfolio.com"
              />
              <div style={styles.modalBtns}>
                <button onClick={() => setEditing(false)} style={styles.btnOutline}>
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ ...styles.btnPrimary, opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
