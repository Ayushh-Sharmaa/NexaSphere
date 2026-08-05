import { useState, useEffect, useCallback } from 'react';

// Validates a date value before formatting — avoids rendering literal
// "Invalid Date" text when the API returns a null or malformed timestamp.
function formatScheduledDate(value) {
  if (!value) return 'Unknown date';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Unknown date';
  return d.toLocaleDateString();
}
import apiClient from '../../utils/apiClient';
import { getApiBase, buildUrl } from '../../utils/runtimeConfig';

function formatSkillSessionDate(value) {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString();
}

const USER_ID = localStorage.getItem('ns_user_id') || `user-${Date.now().toString(36)}`;
const PROFICIENCY = ['Beginner', 'Intermediate', 'Advanced'];
const FORMATS = ['Video', 'Chat', 'In-person'];
const DURATIONS = [30, 60, 90];

function formatSkillDate(value) {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString();
}

if (!localStorage.getItem('ns_user_id')) {
  localStorage.setItem('ns_user_id', USER_ID);
}

export default function SkillExchangePage({ onBack }) {
  const [tab, setTab] = useState('listings');
  const [listings, setListings] = useState([]);
  const [matches, setMatches] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [form, setForm] = useState({
    teach: '',
    learn: '',
    proficiency: 'Intermediate',
    availability: '',
    format: 'Video',
    duration: 60,
    user: USER_ID,
  });
  const [rating, setRating] = useState({ sessionId: null, score: 5, comment: '' });

  const base = getApiBase();
  const api = (path) => buildUrl(base, path);

  const fetchListings = useCallback(async () => {
    const url = api('/api/content/skills/listings');
    if (url)
      try {
        const d = await apiClient(url);
        setListings(d.listings || []);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[SkillExchangePage] Failed to fetch listings:', err.message);
        }
      }
  }, [api]);

  const fetchLeaderboard = useCallback(async () => {
    const url = api('/api/content/skills/leaderboard');
    if (url)
      try {
        const d = await apiClient(url);
        setLeaderboard(d.leaderboard || []);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[SkillExchangePage] Failed to fetch leaderboard:', err.message);
        }
      }
  }, [api]);

  const fetchUserStats = useCallback(async () => {
    const url = api(`/api/content/skills/users/${USER_ID}/stats`);
    if (url)
      try {
        const d = await apiClient(url);
        setUserStats(d);
        setSessions(d.sessions || []);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[SkillExchangePage] Failed to fetch user stats:', err.message);
        }
      }
  }, [api]);

  useEffect(() => {
    fetchListings();
    fetchLeaderboard();
    fetchUserStats();
  }, [fetchListings, fetchLeaderboard, fetchUserStats]);

  const createListing = async () => {
    if (!form.teach.trim() || !form.learn.trim()) return;
    const url = api('/api/content/skills/listings');
    if (url) {
      try {
        await apiClient(url, {
          method: 'POST',
          body: JSON.stringify(form),
          headers: { 'Content-Type': 'application/json' },
        });
        setForm({
          teach: '',
          learn: '',
          proficiency: 'Intermediate',
          availability: '',
          format: 'Video',
          duration: 60,
          user: USER_ID,
        });
        fetchListings();
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[SkillExchangePage] Failed to create listing:', err.message);
        }
      }
    }
  };

  const findMatches = async (listingId) => {
    const url = api(`/api/content/skills/matches/${listingId}`);
    if (url)
      try {
        const d = await apiClient(url);
        setMatches(d.matches || []);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[SkillExchangePage] Failed to find matches:', err.message);
        }
      }
  };

  const bookSession = async (match) => {
    const url = api('/api/content/skills/sessions');
    const scheduledAt = new Date(Date.now() + 86400000).toISOString();
    if (url) {
      try {
        await apiClient(url, {
          method: 'POST',
          body: JSON.stringify({
            fromUser: USER_ID,
            toUser: match.user,
            listingId: match.id,
            scheduledAt,
          }),
          headers: { 'Content-Type': 'application/json' },
        });
        fetchUserStats();
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[SkillExchangePage] Failed to book session:', err.message);
        }
      }
    }
  };

  const completeSession = async (sessionId) => {
    const url = api(`/api/content/skills/sessions/${sessionId}`);
    if (url) {
      try {
        await apiClient(url, {
          method: 'PUT',
          body: JSON.stringify({ notes: 'Session completed' }),
          headers: { 'Content-Type': 'application/json' },
        });
        fetchUserStats();
        fetchLeaderboard();
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[SkillExchangePage] Failed to complete session:', err.message);
        }
      }
    }
  };

  const submitFeedback = async (sessionId) => {
    const url = api(`/api/content/skills/sessions/${sessionId}/feedback`);
    if (url) {
      try {
        const session = sessions.find((s) => s.id === sessionId);
        const to = session?.fromUser === USER_ID ? session.toUser : session.fromUser;
        await apiClient(url, {
          method: 'POST',
          body: JSON.stringify({
            from: USER_ID,
            to,
            rating: rating.score,
            comment: rating.comment,
          }),
          headers: { 'Content-Type': 'application/json' },
        });
        setRating({ sessionId: null, score: 5, comment: '' });
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[SkillExchangePage] Failed to submit feedback:', err.message);
        }
      }
    }
  };

  const userListings = listings.filter((l) => l.user === USER_ID);
  const otherListings = listings.filter((l) => l.user !== USER_ID);

  return (
    <div
      className="page-container"
      style={{ minHeight: '100vh', paddingTop: 40, paddingBottom: 80 }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--c1)',
              cursor: 'pointer',
              fontSize: '1rem',
              marginBottom: 16,
              fontWeight: 600,
            }}
          >
            &larr; Back
          </button>
        )}
        <h1
          style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 'clamp(1.5rem,4vw,2.5rem)',
            marginBottom: 8,
            background: 'linear-gradient(135deg,#CC1111,#FF4444)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Skill Exchange
        </h1>
        <p style={{ color: 'var(--t2)', marginBottom: 32 }}>
          Trade skills with peers — teach what you know, learn what you don&apos;t.
        </p>

        {userStats && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <div
              className="stat-card"
              style={{
                background: 'var(--surface)',
                borderRadius: 12,
                padding: '12 20',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <strong style={{ color: 'var(--c1)' }}>{userStats.stats.xp}</strong> XP
            </div>
            <div
              className="stat-card"
              style={{
                background: 'var(--surface)',
                borderRadius: 12,
                padding: '12 20',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <strong style={{ color: 'var(--c1)' }}>{userStats.stats.streak}</strong> week streak
            </div>
            <div
              className="stat-card"
              style={{
                background: 'var(--surface)',
                borderRadius: 12,
                padding: '12 20',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <strong style={{ color: 'var(--c1)' }}>{userStats.stats.sessions}</strong> sessions
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
          {['listings', 'matches', 'sessions', 'leaderboard'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8 20',
                borderRadius: 20,
                fontWeight: 600,
                fontSize: '0.9rem',
                border: tab === t ? '1px solid var(--c1)' : '1px solid rgba(255,255,255,0.1)',
                background: tab === t ? 'rgba(204,17,17,0.1)' : 'var(--surface)',
                color: tab === t ? 'var(--c1)' : 'var(--t2)',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'listings' && (
          <div>
            <div
              style={{
                background: 'var(--surface)',
                borderRadius: 12,
                padding: 20,
                marginBottom: 24,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <h3 style={{ margin: '0 0 12', fontSize: '1rem' }}>List Your Skills</h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <input
                  placeholder="I can teach... (e.g. Python)"
                  value={form.teach}
                  onChange={(e) => setForm({ ...form, teach: e.target.value })}
                  style={inputStyle}
                />
                <input
                  placeholder="I want to learn... (e.g. React)"
                  value={form.learn}
                  onChange={(e) => setForm({ ...form, learn: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                <select
                  value={form.proficiency}
                  onChange={(e) => setForm({ ...form, proficiency: e.target.value })}
                  style={inputStyle}
                >
                  {PROFICIENCY.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <select
                  value={form.format}
                  onChange={(e) => setForm({ ...form, format: e.target.value })}
                  style={inputStyle}
                >
                  {FORMATS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                <select
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                  style={inputStyle}
                >
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>
                      {d} min
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Availability (e.g. Weekends, Evenings)"
                  value={form.availability}
                  onChange={(e) => setForm({ ...form, availability: e.target.value })}
                  style={{ ...inputStyle, minWidth: 200 }}
                />
              </div>
              <button className="btn-primary" onClick={createListing}>
                Post Listing
              </button>
            </div>

            <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>Your Listings</h3>
            {userListings.map((l) => (
              <div
                key={l.id}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 8,
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong>Teach:</strong> {l.teach} &nbsp; <strong>Learn:</strong> {l.learn} &nbsp;{' '}
                  <span style={{ color: 'var(--t2)', fontSize: '0.85rem' }}>
                    {l.proficiency} · {l.format} · {l.duration}min
                  </span>
                </div>
                <button className="btn-sm" onClick={() => findMatches(l.id)}>
                  Find Matches
                </button>
              </div>
            ))}

            <h3 style={{ fontSize: '1rem', margin: '24 0 12' }}>All Listings</h3>
            {otherListings.map((l) => (
              <div
                key={l.id}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 8,
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <strong>{l.user}</strong> teaches <strong>{l.teach}</strong>, wants to learn{' '}
                <strong>{l.learn}</strong>
                <span style={{ color: 'var(--t2)', fontSize: '0.85rem', marginLeft: 12 }}>
                  {l.proficiency} · {l.format}
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === 'matches' && (
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>Suggested Matches</h3>
            {matches.length === 0 && (
              <p style={{ color: 'var(--t2)' }}>
                Select a listing and click &quot;Find Matches&quot; to discover win-win exchanges.
              </p>
            )}
            {matches.map((m) => (
              <div
                key={m.id}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 12,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{m.user}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--t2)' }}>
                      Teaches: <strong>{m.teach}</strong> · Wants to learn:{' '}
                      <strong>{m.learn}</strong>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--t3)' }}>
                      {m.proficiency} · {m.format} · {m.availability || 'Flexible'}
                    </div>
                  </div>
                  <button className="btn-primary btn-sm" onClick={() => bookSession(m)}>
                    Book Session
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'sessions' && (
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>Your Sessions</h3>
            {sessions.map((s) => (
              <div
                key={s.id}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 12,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      With: {s.fromUser === USER_ID ? s.toUser : s.fromUser}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--t2)' }}>
                      Status: <strong>{s.status}</strong> · Scheduled:{' '}
                      {formatScheduledDate(s.scheduledAt)}
                      {formatSkillSessionDate(s.scheduledAt)}
                      {formatSkillDate(s.scheduledAt)}
                    </div>
                    {s.notes && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--t3)' }}>
                        Notes: {s.notes}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {s.status === 'scheduled' && (
                      <button className="btn-sm" onClick={() => completeSession(s.id)}>
                        Complete
                      </button>
                    )}
                    {s.status === 'completed' && rating.sessionId !== s.id && (
                      <button
                        className="btn-sm"
                        onClick={() => setRating({ ...rating, sessionId: s.id })}
                      >
                        Leave Feedback
                      </button>
                    )}
                  </div>
                </div>
                {rating.sessionId === s.id && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating({ ...rating, score: star })}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            color: star <= rating.score ? '#f59e0b' : 'var(--t3)',
                          }}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <input
                      placeholder="What did you learn?"
                      value={rating.comment}
                      onChange={(e) => setRating({ ...rating, comment: e.target.value })}
                      style={{ ...inputStyle, width: '100%', marginBottom: 8 }}
                    />
                    <button className="btn-primary btn-sm" onClick={() => submitFeedback(s.id)}>
                      Submit
                    </button>
                  </div>
                )}
              </div>
            ))}
            {sessions.length === 0 && (
              <p style={{ color: 'var(--t2)' }}>
                No sessions yet. Find a match and book your first exchange!
              </p>
            )}
          </div>
        )}

        {tab === 'leaderboard' && (
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>Top Exchangers</h3>
            <div
              style={{
                background: 'var(--surface)',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {leaderboard.map((entry, i) => (
                <div
                  key={entry.user}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12 20',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontWeight: 700,
                        color: i < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][i] : 'var(--t2)',
                        marginRight: 12,
                      }}
                    >
                      #{i + 1}
                    </span>
                    <strong>{entry.user === USER_ID ? `${entry.user} (you)` : entry.user}</strong>
                  </div>
                  <div
                    style={{ display: 'flex', gap: 16, fontSize: '0.85rem', color: 'var(--t2)' }}
                  >
                    <span>{entry.xp} XP</span>
                    <span>{entry.sessions} sessions</span>
                    <span>
                      {entry.streak > 0 ? (
                        <span style={{ color: '#F59E0B', fontWeight: 'bold' }}>
                          {entry.streak} 🔥 week streak
                        </span>
                      ) : (
                        `${entry.streak} week streak`
                      )}
                    </span>
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--t2)' }}>
                  No activity yet. Complete your first session to earn XP!
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '8 12',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(0,0,0,0.3)',
  color: 'var(--t1)',
  fontSize: '0.85rem',
  outline: 'none',
};
