import { useEffect } from 'react';

export default function KSSDetailPage({ session, onBack }) {
  useEffect(() => { window.scrollTo({ top: 0 }); }, []);

  if (!session) return null;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px' }}>

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(0,212,255,0.08) 0%, rgba(99,102,241,0.04) 60%, transparent 100%)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '48px 0 40px',
      }}>
        <div className="container">
          {/* Back button */}
          <button
            onClick={onBack}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'none', border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)', borderRadius: '20px',
              padding: '6px 16px', fontSize: '0.85rem', cursor: 'pointer',
              marginBottom: '32px', transition: 'all 0.2s',
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 600,
            }}
            onMouseEnter={e => { e.target.style.borderColor = 'var(--cyan)'; e.target.style.color = 'var(--cyan)'; }}
            onMouseLeave={e => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.color = 'var(--text-secondary)'; }}
          >
            ← Back to Insight Sessions
          </button>

          {/* Title Block */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '3rem' }}>{session.icon}</span>
            <div>
              <h1 style={{
                fontFamily: 'Orbitron, monospace',
                fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
                fontWeight: 900, margin: '0 0 6px',
                background: 'linear-gradient(135deg, var(--cyan), var(--indigo))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                {session.title}
              </h1>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>📅 {session.date}</span>
                <span style={{
                  fontSize: '0.72rem', padding: '2px 10px', borderRadius: '20px',
                  background: 'rgba(34,197,94,0.12)', color: '#22c55e',
                  border: '1px solid rgba(34,197,94,0.3)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  ✅ Completed
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '24px' }}>
            {session.stats.map(s => (
              <div key={s.label} style={{
                background: 'rgba(0,212,255,0.06)', border: '1px solid var(--border-cyan)',
                borderRadius: 'var(--radius-md)', padding: '12px 20px', textAlign: 'center',
                minWidth: '80px',
              }}>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.4rem', fontWeight: 900, color: 'var(--cyan)' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ paddingTop: '48px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>

          {/* Overview */}
          <div>
            <h2 style={{
              fontFamily: 'Orbitron, monospace', fontSize: '1.1rem', fontWeight: 700,
              color: 'var(--indigo)', marginBottom: '16px', letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              📋 Session Overview
            </h2>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderLeft: '3px solid var(--cyan)', borderRadius: 'var(--radius-md)',
              padding: '24px',
            }}>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1rem', margin: 0 }}>
                {session.overview}
              </p>
            </div>
          </div>

          {/* Topics Covered */}
          <div>
            <h2 style={{
              fontFamily: 'Orbitron, monospace', fontSize: '1.1rem', fontWeight: 700,
              color: 'var(--indigo)', marginBottom: '16px', letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              🎯 Topics Covered
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {session.topics.map((topic, i) => (
                <div
                  key={i}
                  className="shimmer-card"
                  style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)', padding: '20px 24px',
                    transition: 'border-color 0.3s, box-shadow 0.3s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-indigo)'; e.currentTarget.style.boxShadow = 'var(--shadow-indigo)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = ''; }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    {/* Number */}
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, var(--cyan), var(--indigo))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Orbitron, monospace', fontWeight: 700, fontSize: '0.8rem', color: '#fff',
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.9rem', fontWeight: 700, color: 'var(--cyan)', marginBottom: '6px' }}>
                        {topic.title}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🎤 {topic.speaker}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>⏱ {topic.duration}</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
                        {topic.summary}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Photos & Videos */}
          <div>
            <h2 style={{
              fontFamily: 'Orbitron, monospace', fontSize: '1.1rem', fontWeight: 700,
              color: 'var(--indigo)', marginBottom: '16px', letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              📸 Photos & Videos
            </h2>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {/* Photo Button */}
              {session.photoLink ? (
                <a
                  href={session.photoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                  style={{ textDecoration: 'none' }}
                >
                  📷 View Photos
                </a>
              ) : (
                <div style={{
                  background: 'var(--bg-card)', border: '1px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-md)', padding: '20px 28px',
                  color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center',
                  flex: 1, minWidth: '180px',
                }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📷</div>
                  <div style={{ fontWeight: 600 }}>Photos</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Coming soon</div>
                </div>
              )}

              {/* Video Button */}
              {session.videoLink ? (
                <a
                  href={session.videoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-indigo"
                  style={{ textDecoration: 'none' }}
                >
                  🎥 Watch Recording
                </a>
              ) : (
                <div style={{
                  background: 'var(--bg-card)', border: '1px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-md)', padding: '20px 28px',
                  color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center',
                  flex: 1, minWidth: '180px',
                }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🎥</div>
                  <div style={{ fontWeight: 600 }}>Video Recording</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Coming soon</div>
                </div>
              )}
            </div>

            {/* Hint to add links */}
            {!session.photoLink && !session.videoLink && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '12px', fontStyle: 'italic' }}>
                Add photo/video links in <code style={{ color: 'var(--cyan)' }}>src/data/insightSessionsData.js</code> → <code style={{ color: 'var(--cyan)' }}>photoLink</code> and <code style={{ color: 'var(--cyan)' }}>videoLink</code> fields.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
