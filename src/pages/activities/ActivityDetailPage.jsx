import { useEffect, useRef, useState } from 'react';

function Counter({ value, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const num = parseInt(value) || 0;
        const dur = 1200;
        const step = 16;
        const inc = num / (dur / step);
        let cur = 0;
        const timer = setInterval(() => {
          cur += inc;
          if (cur >= num) { setCount(num); clearInterval(timer); }
          else setCount(Math.floor(cur));
        }, step);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);

  return <span ref={ref}>{count}{suffix}</span>;
}

function GlitchText({ text, color }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}
      className="glitch-text"
      data-text={text}
    >
      {text}
      <style>{`
        .glitch-text { color: ${color}; }
        .glitch-text::before, .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          opacity: 0;
        }
        .glitch-text:hover::before {
          opacity: 0.7;
          color: #ff0080;
          clip-path: polygon(0 20%, 100% 20%, 100% 40%, 0 40%);
          transform: translateX(-3px);
          animation: glitch1 0.3s steps(2) infinite;
        }
        .glitch-text:hover::after {
          opacity: 0.7;
          color: #00ffff;
          clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%);
          transform: translateX(3px);
          animation: glitch2 0.3s steps(2) infinite;
        }
        @keyframes glitch1 { 0%{transform:translateX(-3px)} 50%{transform:translateX(3px)} 100%{transform:translateX(-3px)} }
        @keyframes glitch2 { 0%{transform:translateX(3px)} 50%{transform:translateX(-3px)} 100%{transform:translateX(3px)} }
      `}</style>
    </span>
  );
}

function FloatingOrbs({ color }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: `${80 + i * 40}px`,
          height: `${80 + i * 40}px`,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
          top: `${10 + (i * 17) % 80}%`,
          left: `${5 + (i * 23) % 90}%`,
          animation: `float ${6 + i * 2}s ease-in-out infinite`,
          animationDelay: `${-i * 1.5}s`,
        }} />
      ))}
    </div>
  );
}

function ScanLine() {
  return (
    <>
      <style>{`
        @keyframes scanline {
          0% { top: -2px; }
          100% { top: 100%; }
        }
      `}</style>
      <div style={{
        position: 'absolute', left: 0, right: 0, height: '2px',
        background: 'linear-gradient(90deg, transparent, var(--cyan), transparent)',
        opacity: 0.3, pointerEvents: 'none', zIndex: 0,
        animation: 'scanline 4s linear infinite',
      }} />
    </>
  );
}

function EventCard({ event, activityColor, onSelect, onDelete }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => onSelect && onSelect(event)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? `linear-gradient(135deg, rgba(${hexToRgb(activityColor)},0.12), var(--bg-card))`
          : 'var(--bg-card)',
        border: `1px solid ${hovered ? activityColor + '80' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '28px',
        cursor: 'pointer',
        transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: hovered ? 'translateY(-8px) scale(1.01)' : 'none',
        boxShadow: hovered ? `0 20px 60px ${activityColor}30, 0 0 0 1px ${activityColor}40` : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      
      {hovered && (
        <div style={{
          position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
          background: `linear-gradient(105deg, transparent 20%, ${activityColor}15 50%, transparent 80%)`,
          animation: 'shimmer 0.6s ease forwards',
          pointerEvents: 'none',
        }} />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={(e) => { e.stopPropagation(); onDelete && onDelete(event.id); }}
            style={{ marginBottom: '8px' }}
          >
            Delete this event
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <h3 style={{
              fontFamily: 'Orbitron, monospace', fontSize: '0.95rem', fontWeight: 700,
              color: activityColor, margin: 0,
            }}>
              {event.name}
            </h3>
            {event.status === 'completed' && (
              <span style={{
                fontSize: '0.7rem', padding: '2px 10px', borderRadius: '20px',
                background: 'rgba(34,197,94,0.12)', color: '#22c55e',
                border: '1px solid rgba(34,197,94,0.3)', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0,
              }}>✅ Completed</span>
            )}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '10px' }}>📅 {event.date}</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0 0 12px', lineHeight: 1.6 }}>
            {event.tagline || event.description}
          </p>
          {event.stats && (
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {event.stats.map(s => (
                <div key={s.label}>
                  <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '1rem', fontWeight: 700, color: activityColor }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            className="btn btn-outline btn-sm"
            onClick={(e) => { e.stopPropagation(); onDelete && onDelete(event.id); }}
            style={{ marginTop: '12px' }}
          >
            Delete this event
          </button>
        </div>
        <div style={{
          color: activityColor, fontSize: '1.4rem', flexShrink: 0,
          transform: hovered ? 'translateX(4px)' : '',
          transition: 'transform 0.3s ease',
        }}>→</div>
      </div>
    </div>
  );
}

function UpcomingCard({ event, color }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px dashed var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      padding: '20px 24px',
      opacity: 0.75,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <div style={{
          width: '10px', height: '10px', borderRadius: '50%',
          border: `2px solid ${color}`,
          animation: 'pulseRing 1.8s infinite',
          flexShrink: 0,
        }} />
        <h4 style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.85rem', color, margin: 0, fontWeight: 700 }}>
          {event.name}
        </h4>
        <span style={{
          fontSize: '0.68rem', padding: '2px 8px', borderRadius: '20px',
          background: `${color}15`, color, border: `1px solid ${color}40`,
          fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0,
        }}>🔜 Upcoming</span>
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '6px' }}>📅 {event.date}</div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>{event.description}</p>
    </div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

export default function ActivityDetailPage({ activity, onBack, onSelectEvent }) {
  const [mounted, setMounted] = useState(false);
  const [manualEvents, setManualEvents] = useState([]);
  const [busy, setBusy] = useState(false);
  const apiBase = (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '');
  const activityKey = encodeURIComponent(activity.title);

  const fetchManualEvents = async () => {
    const url = apiBase ? `${apiBase}/api/content/activity-events/${activityKey}` : `/api/content/activity-events/${activityKey}`;
    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(data?.events)) setManualEvents(data.events);
  };

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setTimeout(() => setMounted(true), 50);
    fetchManualEvents().catch(() => {});
  }, [activity.title]);

  const askAuth = () => {
    const name = window.prompt('Enter your full name (core team):');
    if (!name) return null;
    const email = window.prompt('Enter your email:');
    if (!email) return null;
    const phone = window.prompt('Enter your phone number:');
    if (!phone) return null;
    const password = window.prompt('Enter password:');
    if (!password) return null;
    return { name, email, phone, password };
  };

  const handleAddEvent = async () => {
    const auth = askAuth();
    if (!auth) return;
    const eventName = window.prompt('Event name:');
    if (!eventName) return;
    const eventDate = window.prompt('Event date (e.g. May 20, 2026):');
    if (!eventDate) return;
    const eventTagline = window.prompt('Short tagline (optional):') || '';
    const eventDescription = window.prompt('Event description:');
    if (!eventDescription) return;
    setBusy(true);
    try {
      const url = apiBase ? `${apiBase}/api/content/activity-events/${activityKey}` : `/api/content/activity-events/${activityKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...auth, eventName, eventDate, eventTagline, eventDescription }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to add event');
      alert('Event added successfully.');
      await fetchManualEvents();
    } catch (e) {
      alert(e?.message || 'Unable to add event.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    const auth = askAuth();
    if (!auth) return;
    if (!window.confirm('Delete this event?')) return;
    setBusy(true);
    try {
      const url = apiBase ? `${apiBase}/api/content/activity-events/${activityKey}/${eventId}` : `/api/content/activity-events/${activityKey}/${eventId}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auth),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to delete event');
      alert('Event deleted.');
      await fetchManualEvents();
    } catch (e) {
      alert(e?.message || 'Unable to delete event.');
    } finally {
      setBusy(false);
    }
  };

  const color = activity.color || 'var(--cyan)';
  const rgb = color.startsWith('#') ? hexToRgb(color) : '0,212,255';

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '100px', overflow: 'hidden' }}>

      
      <div style={{
        position: 'relative',
        background: `linear-gradient(180deg, rgba(${rgb},0.10) 0%, rgba(${rgb},0.03) 60%, transparent 100%)`,
        borderBottom: `1px solid rgba(${rgb},0.2)`,
        padding: '60px 0 52px',
        overflow: 'hidden',
      }}>
        <FloatingOrbs color={color} />
        <ScanLine />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          
          <button
            onClick={onBack}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'none', border: `1px solid rgba(${rgb},0.3)`,
              color: color, borderRadius: '20px', padding: '6px 18px',
              fontSize: '0.85rem', cursor: 'pointer', marginBottom: '36px',
              transition: 'all 0.2s', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600,
            }}
            onMouseEnter={e => { e.target.style.background = `rgba(${rgb},0.1)`; e.target.style.transform = 'translateX(-4px)'; }}
            onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.transform = ''; }}
          >
            ← Back to Activities
          </button>

          
          <div style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.7s cubic-bezier(0.22,1,0.36,1)',
          }}>
            <div style={{
              fontSize: '5rem', marginBottom: '16px',
              filter: `drop-shadow(0 0 24px rgba(${rgb},0.6))`,
              animation: 'float 4s ease-in-out infinite',
              display: 'inline-block',
            }}>
              {activity.icon}
            </div>
            <h1 style={{
              fontFamily: 'Orbitron, monospace',
              fontSize: 'clamp(2rem, 6vw, 3.5rem)',
              fontWeight: 900, marginBottom: '8px',
              lineHeight: 1.1,
            }}>
              <GlitchText text={activity.title} color={color} />
            </h1>
            <div style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
              color: `rgba(${rgb},0.8)`,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontWeight: 600,
              marginBottom: '20px',
              opacity: mounted ? 1 : 0,
              transition: 'opacity 0.7s 0.2s ease',
            }}>
              {activity.tagline}
            </div>
            <p style={{
              color: 'var(--text-secondary)', maxWidth: '560px',
              fontSize: '1.05rem', lineHeight: 1.7,
              opacity: mounted ? 1 : 0,
              transition: 'opacity 0.7s 0.35s ease',
            }}>
              {activity.description}
            </p>
          </div>
        </div>
      </div>

      
      <div className="container" style={{ paddingTop: '56px' }}>

        
        {((activity.conductedEvents && activity.conductedEvents.length > 0) || manualEvents.length > 0) && (
          <div style={{ marginBottom: '56px' }}>
            <h2 style={{
              fontFamily: 'Orbitron, monospace', fontSize: '1.1rem', fontWeight: 700,
              color, marginBottom: '24px', letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{
                display: 'inline-block', width: '32px', height: '2px',
                background: `linear-gradient(90deg, ${color}, transparent)`,
              }} />
              Conducted Events
            </h2>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
              <button className="btn btn-primary btn-sm" onClick={handleAddEvent} disabled={busy}>
                {busy ? 'Please wait...' : '+ Add Event'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '760px' }}>
              {[...manualEvents, ...(activity.conductedEvents || [])].map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  activityColor={color}
                  onSelect={onSelectEvent}
                  onDelete={handleDeleteEvent}
                />
              ))}
            </div>
          </div>
        )}

        
        {activity.upcomingEvents && activity.upcomingEvents.length > 0 && (
          <div style={{ maxWidth: '760px' }}>
            <h2 style={{
              fontFamily: 'Orbitron, monospace', fontSize: '1.1rem', fontWeight: 700,
              color: 'var(--text-secondary)', marginBottom: '24px', letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{
                display: 'inline-block', width: '32px', height: '2px',
                background: 'linear-gradient(90deg, var(--text-secondary), transparent)',
              }} />
              Coming Up
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activity.upcomingEvents.map((event, i) => (
                <UpcomingCard key={i} event={event} color={color} />
              ))}
            </div>
          </div>
        )}

        
        {(!activity.conductedEvents || activity.conductedEvents.length === 0) &&
         (!manualEvents || manualEvents.length === 0) &&
         (!activity.upcomingEvents || activity.upcomingEvents.length === 0) && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '80px 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>{activity.icon}</div>
            <p>Events coming soon. Watch this space!</p>
          </div>
        )}
      </div>
    </div>
  );
}

