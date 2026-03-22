import { useEffect, useState, useRef } from 'react';

// ── Helpers ──
function hexToRgb(hex) {
  if (!hex || !hex.startsWith('#')) return '0,212,255';
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
}

// ── Typewriter ──
function Typewriter({ text, speed = 10 }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        let i = 0;
        const t = setInterval(() => {
          setDisplayed(text.slice(0, i + 1));
          i++;
          if (i >= text.length) { setDone(true); clearInterval(t); }
        }, speed);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [text, speed]);
  return (
    <span ref={ref}>
      {displayed}
      {!done && <span style={{ animation: 'blink 0.7s step-end infinite' }}>|</span>}
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </span>
  );
}

// ── Animated Stat ──
function StatCard({ label, value, color }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const num = parseInt(value);
        if (isNaN(num)) { setCount(value); return; }
        let cur = 0;
        const t = setInterval(() => {
          cur += Math.ceil(num / 40);
          if (cur >= num) { setCount(num); clearInterval(t); }
          else setCount(cur);
        }, 25);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [value]);
  const rgb = hexToRgb(color);
  return (
    <div ref={ref} style={{
      background: `rgba(${rgb},0.07)`, border: `1px solid rgba(${rgb},0.25)`,
      borderRadius: '12px', padding: '16px 22px', textAlign: 'center', minWidth: '85px',
      transition: 'all 0.3s ease',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 32px rgba(${rgb},0.2)`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{ fontFamily: 'Orbitron,monospace', fontSize: '1.7rem', fontWeight: 900, color, textShadow: `0 0 16px rgba(${rgb},0.5)` }}>
        {count}
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '3px' }}>{label}</div>
    </div>
  );
}

// ── Section Header ──
function SectionHeader({ icon, title, color }) {
  return (
    <h2 style={{
      fontFamily: 'Orbitron,monospace', fontSize: '0.9rem', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px',
      display: 'flex', alignItems: 'center', gap: '10px', color,
    }}>
      <span style={{
        width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
        background: `rgba(${hexToRgb(color)},0.15)`, border: `1px solid rgba(${hexToRgb(color)},0.3)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem',
      }}>{icon}</span>
      {title}
    </h2>
  );
}

// ── Person Chip ──
function PersonChip({ name, role, color, emoji = '⚡' }) {
  const [hovered, setHovered] = useState(false);
  const rgb = hexToRgb(color);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        background: hovered ? `rgba(${rgb},0.15)` : `rgba(${rgb},0.07)`,
        border: `1px solid ${hovered ? color : `rgba(${rgb},0.25)`}`,
        borderRadius: '50px', padding: '8px 16px',
        transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hovered ? 'translateY(-3px) scale(1.03)' : '',
        boxShadow: hovered ? `0 8px 20px rgba(${rgb},0.2)` : '',
        cursor: 'default',
      }}
    >
      <span style={{ fontSize: '1rem' }}>{emoji}</span>
      <div>
        <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, color: hovered ? color : 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.2 }}>{name}</div>
        {role && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{role}</div>}
      </div>
    </div>
  );
}

// ── Topic Card ──
function TopicCard({ topic, index, color }) {
  const [hovered, setHovered] = useState(false);
  const rgb = hexToRgb(color);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? `linear-gradient(135deg,rgba(${rgb},0.1),var(--bg-card))` : 'var(--bg-card)',
        border: `1px solid ${hovered ? color+'60' : 'var(--border-subtle)'}`,
        borderLeft: `3px solid ${hovered ? color : `rgba(${rgb},0.4)`}`,
        borderRadius: '0 12px 12px 0',
        padding: '20px 24px',
        transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hovered ? 'translateX(6px)' : '',
        boxShadow: hovered ? `0 8px 28px rgba(${rgb},0.15)` : '',
      }}
    >
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg,${color},rgba(${rgb},0.5))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Orbitron,monospace', fontWeight: 900, fontSize: '0.78rem', color: '#fff',
          boxShadow: `0 0 14px rgba(${rgb},0.4)`,
          transition: 'transform 0.3s ease',
          transform: hovered ? 'scale(1.15) rotate(8deg)' : '',
        }}>{String(index+1).padStart(2,'0')}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Orbitron,monospace', fontSize: '0.88rem', fontWeight: 700, color, marginBottom: '6px' }}>{topic.title}</div>
          <div style={{ display: 'flex', gap: '14px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>🎤 {topic.speaker}</span>
            {topic.role && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>· {topic.role}</span>}
            {topic.duration !== '—' && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>⏱ {topic.duration}</span>}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0, lineHeight: 1.65 }}>{topic.summary}</p>
        </div>
      </div>
    </div>
  );
}

// ── Acknowledgement Card ──
function AckCard({ ack, color }) {
  const [hovered, setHovered] = useState(false);
  const rgb = hexToRgb(color);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? `rgba(${rgb},0.06)` : 'var(--bg-card)',
        border: `1px solid ${hovered ? `rgba(${rgb},0.3)` : 'var(--border-subtle)'}`,
        borderRadius: '12px', padding: '18px 20px',
        transition: 'all 0.3s ease',
        transform: hovered ? 'translateY(-3px)' : '',
        boxShadow: hovered ? `0 8px 24px rgba(${rgb},0.12)` : '',
      }}
    >
      <div style={{ fontFamily: 'Orbitron,monospace', fontSize: '0.82rem', fontWeight: 700, color, marginBottom: '3px' }}>
        🙏 {ack.name}
      </div>
      <div style={{ fontSize: '0.72rem', color, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
        {ack.title}
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0, lineHeight: 1.55 }}>{ack.note}</p>
    </div>
  );
}

// ── Media Button ──
function MediaBtn({ href, icon, label, color }) {
  const [hovered, setHovered] = useState(false);
  const rgb = hexToRgb(color);
  if (!href) {
    return (
      <div style={{
        background: 'var(--bg-card)', border: '1px dashed var(--border-subtle)',
        borderRadius: '12px', padding: '20px 28px', color: 'var(--text-muted)',
        textAlign: 'center', flex: 1, minWidth: '140px',
      }}>
        <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>{icon}</div>
        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '3px' }}>{label}</div>
        <div style={{ fontSize: '0.72rem' }}>Coming soon</div>
      </div>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1, minWidth: '140px', textDecoration: 'none',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
        padding: '20px 28px', borderRadius: '12px',
        background: hovered ? `rgba(${rgb},0.12)` : 'var(--bg-card)',
        border: `1px solid ${hovered ? color : 'var(--border-subtle)'}`,
        color: hovered ? color : 'var(--text-primary)',
        transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hovered ? 'translateY(-6px) scale(1.03)' : '',
        boxShadow: hovered ? `0 16px 40px rgba(${rgb},0.25)` : '',
      }}
    >
      <div style={{ fontSize: '2rem', transition: 'transform 0.3s', transform: hovered ? 'scale(1.2) rotate(-5deg)' : '' }}>{icon}</div>
      <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
    </a>
  );
}

// ════════════════════════════════════════
export default function EventDetailPage({ event, activityColor, activityIcon, onBack }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { window.scrollTo({ top: 0 }); setTimeout(() => setMounted(true), 60); }, []);

  const color = activityColor || '#a855f7';
  const rgb = hexToRgb(color);

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '100px' }}>

      {/* ── Hero ── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: `linear-gradient(160deg, rgba(${rgb},0.12) 0%, rgba(${rgb},0.03) 50%, transparent 100%)`,
        borderBottom: `1px solid rgba(${rgb},0.2)`,
        padding: '60px 0 52px',
      }}>
        {/* Grid bg */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `linear-gradient(rgba(${rgb},0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(${rgb},0.05) 1px, transparent 1px)`,
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
        }} />
        <div style={{
          position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)',
          width: '700px', height: '700px', borderRadius: '50%',
          background: `radial-gradient(circle, rgba(${rgb},0.1) 0%, transparent 70%)`,
          pointerEvents: 'none', zIndex: 0,
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <button onClick={onBack} style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'none', border: `1px solid rgba(${rgb},0.3)`,
            color, borderRadius: '20px', padding: '6px 18px',
            fontSize: '0.85rem', cursor: 'pointer', marginBottom: '36px',
            transition: 'all 0.2s', fontFamily: 'Rajdhani,sans-serif', fontWeight: 600,
          }}
            onMouseEnter={e => { e.target.style.background = `rgba(${rgb},0.12)`; e.target.style.transform = 'translateX(-4px)'; }}
            onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.transform = ''; }}
          >← Back to Insight Sessions</button>

          <div style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(36px)',
            transition: 'all 0.8s cubic-bezier(0.22,1,0.36,1)',
          }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.3)`,
              borderRadius: '20px', padding: '4px 14px', marginBottom: '18px',
              fontSize: '0.78rem', color, fontFamily: 'Rajdhani,sans-serif',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              {activityIcon} Insight Session · KSS #153
            </div>

            <h1 style={{
              fontFamily: 'Orbitron,monospace',
              fontSize: 'clamp(1.5rem, 4.5vw, 2.8rem)',
              fontWeight: 900, marginBottom: '8px', lineHeight: 1.15,
              background: `linear-gradient(135deg, ${color}, #ffffff90)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Impact of AI 🤖🔥
            </h1>

            <p style={{
              fontFamily: 'Rajdhani,sans-serif', fontSize: '1.05rem',
              color: `rgba(${rgb},0.8)`, fontStyle: 'italic', marginBottom: '6px',
              opacity: mounted ? 1 : 0, transition: 'opacity 0.7s 0.2s',
            }}>
              "{event.tagline}"
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '28px', marginTop: '12px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>📅 {event.date}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>📍 GL Bajaj Group of Institutions, Mathura</span>
              <span style={{
                fontSize: '0.72rem', padding: '3px 12px', borderRadius: '20px',
                background: 'rgba(34,197,94,0.12)', color: '#22c55e',
                border: '1px solid rgba(34,197,94,0.3)', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>✅ Completed</span>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {event.stats?.map(s => <StatCard key={s.label} label={s.label} value={s.value} color={color} />)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="container" style={{ paddingTop: '52px' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px' }}>

          {/* Overview */}
          <section>
            <SectionHeader icon="📋" title="Session Overview" color={color} />
            <div style={{
              background: 'var(--bg-card)', borderLeft: `3px solid ${color}`,
              borderRadius: '0 12px 12px 0', padding: '28px 32px',
              border: `1px solid rgba(${rgb},0.15)`, borderLeftWidth: '3px',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, right: 0, width: '150px', height: '150px',
                background: `radial-gradient(circle, rgba(${rgb},0.07), transparent)`,
                pointerEvents: 'none',
              }} />
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.85, fontSize: '0.98rem', margin: 0, whiteSpace: 'pre-line' }}>
                <Typewriter text={event.overview} speed={6} />
              </p>
            </div>
          </section>

          {/* Presenters */}
          <section>
            <SectionHeader icon="🎤" title="Presenters" color={color} />
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {event.topics?.map((t, i) => (
                <PersonChip key={i} name={t.speaker} role="Presenter" color={color} emoji="👨‍💻" />
              ))}
            </div>
          </section>

          {/* Topics */}
          <section>
            <SectionHeader icon="🎯" title="Topics Covered" color={color} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {event.topics?.map((t, i) => <TopicCard key={i} topic={t} index={i} color={color} />)}
            </div>
          </section>

          {/* Video Presentors & Anchor */}
          {(event.videoPresenter?.length > 0 || event.anchor) && (
            <section>
              <SectionHeader icon="🎬" title="Video Presentors & Anchor" color={color} />
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {event.videoPresenter?.map((p, i) => (
                  <PersonChip key={i} name={p.name} role={p.role} color={color} emoji="🎥" />
                ))}
                {event.anchor && (
                  <PersonChip name={event.anchor.name} role={event.anchor.role} color={color} emoji="🎤" />
                )}
              </div>
            </section>
          )}

          {/* Volunteers */}
          {event.volunteers?.length > 0 && (
            <section>
              <SectionHeader icon="⚡" title="Volunteers — The Unsung Heroes" color={color} />
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {event.volunteers.map((v, i) => (
                  <PersonChip key={i} name={v.name} role="Volunteer" color={color} emoji="⚡" />
                ))}
              </div>
            </section>
          )}

          {/* Acknowledgements */}
          {event.acknowledgements?.length > 0 && (
            <section>
              <SectionHeader icon="🙏" title="Special Thanks" color={color} />
              <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {event.acknowledgements.map((a, i) => <AckCard key={i} ack={a} color={color} />)}
              </div>
            </section>
          )}

          {/* Photos & Videos */}
          <section>
            <SectionHeader icon="📸" title="Photos & Videos" color={color} />
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <MediaBtn href={event.photoLink} icon="📷" label="View Photos" color={color} />
              <MediaBtn href={event.videoLink} icon="🎥" label="Watch Recording" color={color} />
            </div>
            {!event.photoLink && !event.videoLink && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '12px', fontStyle: 'italic' }}>
                Add links in <code style={{ color }}>src/data/activityPagesData.js</code> → KSS #153 → <code style={{ color }}>photoLink</code> / <code style={{ color }}>videoLink</code>
              </p>
            )}
          </section>

          {/* Closing Note */}
          {event.closingNote && (
            <section>
              <div style={{
                background: `linear-gradient(135deg, rgba(${rgb},0.08), rgba(${rgb},0.03))`,
                border: `1px solid rgba(${rgb},0.25)`,
                borderRadius: '16px', padding: '28px 32px', textAlign: 'center',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `radial-gradient(rgba(${rgb},0.08) 1px, transparent 1px)`,
                  backgroundSize: '20px 20px', pointerEvents: 'none',
                }} />
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🚀</div>
                <p style={{
                  fontFamily: 'Rajdhani,sans-serif', fontSize: '1.1rem', fontWeight: 600,
                  color: 'var(--text-primary)', lineHeight: 1.7, margin: '0 0 16px',
                  position: 'relative',
                }}>
                  {event.closingNote}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, fontStyle: 'italic' }}>
                  Stay tuned. Stay curious. The best is yet to come. 💥
                </p>
              </div>
            </section>
          )}

          {/* Hashtags */}
          {event.hashtags?.length > 0 && (
            <section>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {event.hashtags.map(tag => (
                  <span key={tag} style={{
                    fontSize: '0.78rem', padding: '4px 12px', borderRadius: '20px',
                    background: `rgba(${rgb},0.08)`, color,
                    border: `1px solid rgba(${rgb},0.2)`,
                    fontFamily: 'Rajdhani,sans-serif', fontWeight: 600,
                    letterSpacing: '0.03em', cursor: 'default',
                    transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => { e.target.style.background = `rgba(${rgb},0.18)`; e.target.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.target.style.background = `rgba(${rgb},0.08)`; e.target.style.transform = ''; }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
