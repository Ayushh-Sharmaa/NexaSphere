import { useEffect, useRef, useState } from 'react';
import { DynamicIcon } from '../../shared/Icons';
import apiClient from '../../utils/apiClient.js';
import DOMPurify from 'dompurify';
import { getApiBase } from '../../utils/runtimeConfig';
import { formatWithTimezone } from '../../utils/timezoneUtils';

/* ── Animated counter ── */
function Counter({ value, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const num = parseInt(value, 10) || 0;
          const dur = 1200;
          const step = 16;
          const inc = num / (dur / step);
          let cur = 0;
          const timer = setInterval(() => {
            cur += inc;
            if (cur >= num) {
              setCount(num);
              clearInterval(timer);
            } else setCount(Math.floor(cur));
          }, step);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

/* ── Glitch hover text effect ── */
function GlitchText({ text, color }) {
  return (
    <span
      style={{ position: 'relative', display: 'inline-block', color }}
      className="glitch-text"
      data-text={text}
    >
      {text}
    </span>
  );
}

/* ── Floating ambient orbs ── */
function FloatingOrbs({ color }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {[...Array(6)].map((_, i) => (
        <div
          key={`circle-${i}`}
          style={{
            position: 'absolute',
            width: `${80 + i * 40}px`,
            height: `${80 + i * 40}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
            top: `${10 + ((i * 17) % 80)}%`,
            left: `${5 + ((i * 23) % 90)}%`,
            animation: `float ${6 + i * 2}s ease-in-out infinite`,
            animationDelay: `${-i * 1.5}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Animated scan line ── */
function ScanLine({ color }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: '2px',
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        opacity: 0.3,
        pointerEvents: 'none',
        zIndex: 0,
        animation: 'scanline 4s linear infinite',
      }}
    />
  );
}

/* ── Clickable event card — no admin controls ── */
function EventCard({ event, activityColor, onSelect }) {
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
        boxShadow: hovered
          ? `0 20px 60px ${activityColor}30, 0 0 0 1px ${activityColor}40`
          : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {hovered && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '60%',
            height: '100%',
            background: `linear-gradient(105deg, transparent 20%, ${activityColor}15 50%, transparent 80%)`,
            animation: 'shimmer 0.6s ease forwards',
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '8px',
              flexWrap: 'wrap',
            }}
          >
            <h3
              style={{
                fontFamily: 'Orbitron, monospace',
                fontSize: '0.95rem',
                fontWeight: 700,
                color: activityColor,
                margin: 0,
              }}
            >
              {event.name}
            </h3>
            {event.status === 'completed' && (
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 10px',
                  borderRadius: '20px',
                  background: 'rgba(34,197,94,0.12)',
                  color: '#22c55e',
                  border: '1px solid rgba(34,197,94,0.3)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  flexShrink: 0,
                }}
              >
                <DynamicIcon name="CheckCircle" size={14} /> Completed
              </span>
            )}
          </div>
          <div
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              marginBottom: '10px',
            }}
          >
            <DynamicIcon name="Calendar" size={14} />{' '}
            {event.dateText ? event.dateText : formatWithTimezone(event.date)}
          </div>
          <div
            className="event-description-html"
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              lineHeight: 1.6,
            }}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(event.tagline || event.description || ''),
            }}
          />
          {event.stats && (
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {event.stats.map((s) => (
                <div key={s.label}>
                  <div
                    style={{
                      fontFamily: 'Orbitron, monospace',
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: activityColor,
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      fontSize: '0.68rem',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div
          style={{
            color: activityColor,
            fontSize: '1.4rem',
            flexShrink: 0,
            transform: hovered ? 'translateX(4px)' : '',
            transition: 'transform 0.3s ease',
          }}
        >
          →
        </div>
      </div>
    </div>
  );
}

/* ── Upcoming event placeholder card ── */
function UpcomingCard({ event, color }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px dashed var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '20px 24px',
        opacity: 0.75,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '6px',
        }}
      >
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            border: `2px solid ${color}`,
            animation: 'pulseRing 1.8s infinite',
            flexShrink: 0,
          }}
        />
        <h4
          style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: '0.85rem',
            color,
            margin: 0,
            fontWeight: 700,
          }}
        >
          {event.name}
        </h4>
        <span
          style={{
            fontSize: '0.68rem',
            padding: '2px 8px',
            borderRadius: '20px',
            background: `${color}15`,
            color,
            border: `1px solid ${color}40`,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            flexShrink: 0,
          }}
        >
          <DynamicIcon name="Flame" size={14} /> Upcoming
        </span>
      </div>
      <div
        style={{
          color: 'var(--text-muted)',
          fontSize: '0.78rem',
          marginBottom: '6px',
        }}
      >
        <DynamicIcon name="Calendar" size={14} />{' '}
        {event.dateText ? event.dateText : formatWithTimezone(event.date)}
      </div>
      <div
        className="event-description-html"
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.92rem',
          lineHeight: 1.6,
          margin: 0,
        }}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(event.description || '') }}
      />
    </div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

export default function ActivityDetailPage({ activity, onBack, onSelectEvent }) {
  const [mounted, setMounted] = useState(false);
  const [manualEvents, setManualEvents] = useState([]);
  const [fetchState, setFetchState] = useState('idle'); // 'idle' | 'loading' | 'done' | 'error'
  const apiBase = getApiBase();
  const activityKey = encodeURIComponent(activity.title);

  /* ── Fetch API-managed events with loading state ── */
  useEffect(() => {
    window.scrollTo({ top: 0 });
    // Slight delay so the mount animation is visible first
    const mountTimer = setTimeout(() => setMounted(true), 50);

    setFetchState('loading');
    const url = apiBase
      ? `${apiBase}/api/content/activity-events/${activityKey}`
      : `/api/content/activity-events/${activityKey}`;

    apiClient(url)
      .then((data) => {
        if (Array.isArray(data?.events)) {
          setManualEvents(data.events);
        }
        setFetchState('done');
      })
      .catch(() => {
        // API unreachable — gracefully fall back to static data only
        setFetchState('error');
      });

    return () => clearTimeout(mountTimer);
  }, [activity.title]);

  /* ── Local scroll-reveal observer (sub-pages mount after global observer runs) ── */
  const pendingAnimationListenersRef = useRef([]);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !e.target.classList.contains('fired')) {
            e.target.classList.add('fired');
            const target = e.target;
            const handler = () => {
              target.style.opacity = '1';
              target.style.transform = 'none';
              pendingAnimationListenersRef.current = pendingAnimationListenersRef.current.filter(
                (entry) => entry.target !== target
              );
            };
            target.addEventListener('animationend', handler, { once: true });
            pendingAnimationListenersRef.current.push({ target, handler });
            obs.unobserve(target);
          }
        });
      },
      { threshold: 0.09, rootMargin: '0px 0px -36px 0px' }
    );

    document
      .querySelectorAll(
        '#activity-detail-page .pop-in, #activity-detail-page .pop-left, #activity-detail-page .pop-right, #activity-detail-page .pop-scale'
      )
      .forEach((el) => obs.observe(el));

    return () => {
      obs.disconnect();
      pendingAnimationListenersRef.current.forEach(({ target, handler }) => {
        target.removeEventListener('animationend', handler);
      });
      pendingAnimationListenersRef.current = [];
    };
  }, [manualEvents]); // re-run after manual events load so new cards are observed

  const color = activity.color || 'var(--cyan)';
  const rgb = color.startsWith('#') ? hexToRgb(color) : '0,212,255';
  const allConducted = [...manualEvents, ...(activity.conductedEvents || [])];

  return (
    <div
      id="activity-detail-page"
      style={{ minHeight: '100vh', paddingBottom: '100px', overflow: 'hidden' }}
    >
      {/* ── Hero banner ── */}
      <div
        style={{
          position: 'relative',
          background: `linear-gradient(180deg, rgba(${rgb},0.15) 0%, rgba(${rgb},0.06) 60%, transparent 100%)`,
          borderBottom: `1px solid rgba(${rgb},0.3)`,
          padding: '60px 0 52px',
          overflow: 'hidden',
        }}
      >
        <FloatingOrbs color={color} />
        <ScanLine color={color} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <button
            onClick={onBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: `1px solid rgba(${rgb},0.3)`,
              color: color,
              borderRadius: '20px',
              padding: '6px 18px',
              fontSize: '0.85rem',
              cursor: 'pointer',
              marginBottom: '36px',
              transition: 'all 0.2s',
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 600,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `rgba(${rgb},0.1)`;
              e.currentTarget.style.transform = 'translateX(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.transform = '';
            }}
          >
            ← Back to Activities
          </button>

          <div
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.7s cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            <div
              style={{
                fontSize: '5rem',
                marginBottom: '16px',
                filter: `drop-shadow(0 0 24px rgba(${rgb},0.6))`,
                animation: 'float 4s ease-in-out infinite',
                display: 'inline-block',
              }}
            >
              <DynamicIcon name={activity.icon} size={80} />
            </div>
            <h1
              style={{
                fontFamily: 'Orbitron, monospace',
                fontSize: 'clamp(2rem, 6vw, 3.5rem)',
                fontWeight: 900,
                marginBottom: '8px',
                lineHeight: 1.1,
              }}
            >
              <GlitchText text={activity.title} color={color} />
            </h1>
            <div
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
                color: `rgba(${rgb},0.8)`,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                fontWeight: 600,
                marginBottom: '20px',
                opacity: mounted ? 1 : 0,
                transition: 'opacity 0.7s 0.2s ease',
              }}
            >
              {activity.tagline}
            </div>
            <div
              className="event-description-html"
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.98rem',
                lineHeight: 1.65,
                margin: 0,
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(15px)',
                transition: 'all 0.7s 0.35s ease',
              }}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(activity.description || '') }}
            />
          </div>
        </div>
      </div>

      {/* ── Content area — reduced top padding to avoid double-gap ── */}
      <div className="container" style={{ paddingTop: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 0' }}>
          <label style={{ fontSize: '0.85rem', marginRight: '8px', color: 'var(--t2)' }}>
            Timezone:
          </label>
          <select
            style={{
              fontSize: '0.85rem',
              padding: '4px',
              borderRadius: '4px',
              background: 'var(--bg2)',
              color: 'var(--t1)',
              border: '1px solid var(--bdr1)',
            }}
            onChange={(e) => {
              if (e.target.value) {
                localStorage.setItem('preferredTimezone', e.target.value);
              } else {
                localStorage.removeItem('preferredTimezone');
              }
              window.location.reload();
            }}
            defaultValue={
              typeof window !== 'undefined' ? localStorage.getItem('preferredTimezone') || '' : ''
            }
          >
            <option value="">Browser Default</option>
            <option value="America/New_York">EST (New York)</option>
            <option value="America/Los_Angeles">PST (Los Angeles)</option>
            <option value="Europe/London">GMT (London)</option>
            <option value="Asia/Kolkata">IST (Kolkata)</option>
            <option value="Asia/Tokyo">JST (Tokyo)</option>
          </select>
        </div>

        {/* Conducted Events */}
        {(allConducted.length > 0 || fetchState === 'loading') && (
          <div style={{ marginBottom: '48px' }}>
            <h2
              className="pop-in"
              style={{
                fontFamily: 'Orbitron, monospace',
                fontSize: '1.1rem',
                fontWeight: 700,
                color,
                marginBottom: '24px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '32px',
                  height: '2px',
                  background: `linear-gradient(90deg, ${color}, transparent)`,
                }}
              />
              Conducted Events
            </h2>

            {/* Loading state while API events are fetching */}
            {fetchState === 'loading' && manualEvents.length === 0 && (
              <div
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  padding: '12px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <DynamicIcon name="Loader" size={16} /> Loading events…
              </div>
            )}

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                maxWidth: '760px',
              }}
            >
              {allConducted.map((event) => (
                <div key={event.id} className="pop-in">
                  <EventCard event={event} activityColor={color} onSelect={onSelectEvent} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        {activity.upcomingEvents && activity.upcomingEvents.length > 0 && (
          <div style={{ maxWidth: '760px' }}>
            <h2
              className="pop-in"
              style={{
                fontFamily: 'Orbitron, monospace',
                fontSize: '1.1rem',
                fontWeight: 700,
                color,
                marginBottom: '24px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '32px',
                  height: '2px',
                  background: `linear-gradient(90deg, ${color}, transparent)`,
                }}
              />
              Coming Up
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activity.upcomingEvents.map((event, i) => (
                <div key={event.id || i} className="pop-in">
                  <UpcomingCard event={event} color={color} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {allConducted.length === 0 &&
          fetchState !== 'loading' &&
          (!activity.upcomingEvents || activity.upcomingEvents.length === 0) && (
            <div
              style={{
                textAlign: 'center',
                color: 'var(--text-muted)',
                padding: '80px 0',
              }}
            >
              <div style={{ fontSize: '4rem', marginBottom: '16px' }}>{activity.icon}</div>
              <p>Events coming soon. Watch this space!</p>
            </div>
          )}
      </div>
    </div>
  );
}
