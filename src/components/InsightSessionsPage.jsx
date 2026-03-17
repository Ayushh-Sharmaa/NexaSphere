import { useEffect } from 'react';
import { insightSessions } from '../data/insightSessionsData';

export default function InsightSessionsPage({ onSelectSession, onBack }) {
  // Scroll to top on mount
  useEffect(() => { window.scrollTo({ top: 0 }); }, []);

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(0,212,255,0.06) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '48px 0 40px',
        textAlign: 'center',
      }}>
        <div className="container">
          <button
            onClick={onBack}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'none', border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)', borderRadius: '20px',
              padding: '6px 16px', fontSize: '0.85rem', cursor: 'pointer',
              marginBottom: '24px', transition: 'all 0.2s',
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 600,
            }}
            onMouseEnter={e => { e.target.style.borderColor = 'var(--cyan)'; e.target.style.color = 'var(--cyan)'; }}
            onMouseLeave={e => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.color = 'var(--text-secondary)'; }}
          >
            ← Back to Activities
          </button>

          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
          <h1 style={{
            fontFamily: 'Orbitron, monospace', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
            fontWeight: 900, marginBottom: '12px',
            background: 'linear-gradient(135deg, var(--cyan), var(--indigo))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Insight Sessions
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '520px', margin: '0 auto' }}>
            Deep-dive talks and knowledge sharing events — exploring tech, careers, and ideas.
          </p>
        </div>
      </div>

      {/* Sessions List */}
      <div className="container" style={{ paddingTop: '48px' }}>
        {insightSessions.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '64px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🚀</div>
            <p>Sessions coming soon. Stay tuned!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '700px', margin: '0 auto' }}>
            {insightSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSelectSession(session)}
                className="shimmer-card"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '28px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--border-cyan)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-cyan)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ fontSize: '2rem', flexShrink: 0 }}>{session.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <h3 style={{
                        fontFamily: 'Orbitron, monospace', fontSize: '1rem',
                        fontWeight: 700, color: 'var(--cyan)', margin: 0,
                      }}>
                        {session.title}
                      </h3>
                      <span style={{
                        fontSize: '0.72rem', padding: '2px 10px', borderRadius: '20px',
                        background: 'rgba(34,197,94,0.12)', color: '#22c55e',
                        border: '1px solid rgba(34,197,94,0.3)', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        {session.status === 'completed' ? '✅ Completed' : '🔜 Upcoming'}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '8px' }}>
                      📅 {session.date}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: '0 0 12px' }}>
                      {session.tagline}
                    </p>
                    {/* Stats row */}
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      {session.stats.map(s => (
                        <div key={s.label} style={{ textAlign: 'center' }}>
                          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '1rem', fontWeight: 700, color: 'var(--cyan)' }}>
                            {s.value}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {s.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Arrow */}
                  <div style={{ color: 'var(--cyan)', fontSize: '1.2rem', alignSelf: 'center', flexShrink: 0 }}>→</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
