import { useEffect, useRef } from 'react';
import { events } from '../data/eventsData';

function useRevealAll(selector) {
  useEffect(() => {
    const els = document.querySelectorAll(selector);
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

export default function EventsSection() {
  useRevealAll('#section-events .reveal');

  return (
    <section className="section" id="section-events">
      <div className="container">
        <h2 className="section-title reveal">Our Events</h2>
        <p className="section-subtitle reveal" style={{ transitionDelay: '0.1s' }}>
          Where Ideas Come to Life
        </p>

        <div className="events-timeline">
          {events.map((event, i) => (
            <div className="timeline-item reveal" key={event.id}>
              {/* Dot */}
              <div
                className={`timeline-dot${event.status === 'upcoming' ? ' upcoming timeline-dot-upcoming' : ''}`}
              />

              {/* Card */}
              <div className={`timeline-card shimmer-card reveal-delay-${Math.min(i + 1, 6)}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.6rem' }}>{event.icon}</span>
                  <div className="timeline-event-name">{event.name}</div>
                </div>

                <div className="timeline-event-date">
                  📅 {event.date}
                </div>

                <p className="timeline-event-desc">{event.description}</p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className={`timeline-badge ${event.status}`}>
                    {event.status === 'completed' ? '✅ Completed' : '🔜 Upcoming'}
                  </span>
                  {event.tags?.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: '0.72rem',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        background: 'rgba(99,102,241,0.12)',
                        color: 'var(--indigo)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Coming soon placeholder */}
          {events.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🚀</div>
              <p>Exciting events coming soon. Stay tuned!</p>
            </div>
          )}

          {events.length > 0 && (
            <div className="timeline-item reveal">
              <div className="timeline-dot upcoming timeline-dot-upcoming" />
              <div className="timeline-card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '1.5rem' }}>🚀</span>
                <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>
                  More exciting events are being planned. Watch this space!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
