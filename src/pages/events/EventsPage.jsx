import { useEffect } from 'react';
import { events as fallbackEvents } from '../../data/eventsData';
import { BannerOrbs } from '../../shared/MotionLayer';
import Footer from '../../shared/Footer';
import { DynamicIcon } from '../../shared/Icons';

export default function EventsPage({ onBack, onEventClick, events = fallbackEvents }) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('fired'); obs.unobserve(e.target); } });
    }, { threshold: 0, rootMargin: '0px 0px -10px 0px' });
    document.querySelectorAll('#events-page .pop-in, #events-page .pop-left, #events-page .pop-right, #events-page .pop-word').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div id="events-page" style={{ minHeight: '100vh', padding: '0 0 100px' }}>
      
      <div className="page-banner" style={{
        background: 'linear-gradient(135deg, rgba(0,212,255,.06), rgba(123,111,255,.04))',
        borderBottom: '1px solid var(--bdr)',
        padding: '70px 0 50px',
        textAlign: 'center',
        marginBottom: '60px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div className="page-banner-line" style={{ position:'absolute',top:0,left:0,right:0,height:'3px',background:'linear-gradient(90deg,var(--c1),var(--c2),var(--c3))' }}/>
        <BannerOrbs color="rgba(123,111,255,.06)"/>
        <button onClick={onBack} className="ns-back-btn" style={{
          position: 'absolute', top: '24px', left: '28px',
          background: 'var(--card)', border: '1px solid var(--bdr)',
          borderRadius: '50px', padding: '7px 16px',
          color: 'var(--t2)', fontSize: '.8rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px',
          fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
        }}>← Back</button>

        <span className="cin-section-label pop-in" style={{position:'relative',zIndex:1}}>NexaSphere · GL Bajaj</span>
        <h1 className="section-title pop-word" style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', position:'relative',zIndex:1 }}>Our Events</h1>
        <p className="section-subtitle pop-in" style={{ animationDelay: '.1s', maxWidth: '520px', margin: '0 auto', position:'relative',zIndex:1 }}>
          Where ideas come to life. Every event is a milestone in the NexaSphere journey.
        </p>
      </div>

      <div className="container">
        <div className="events-timeline ns-reveal">
          {events.map((ev, i) => {
            const isKSS = ev.id === 1 || ev.id === 'kss-153' || String(ev.shortName || '').toLowerCase().includes('kss');
            return (
              <div className="timeline-item" key={ev.id}>
                <div className={`timeline-dot${ev.status === 'upcoming' ? ' upcoming' : ''}`} />
                <div
                  className={`timeline-card shimmer ${i % 2 === 0 ? 'pop-left' : 'pop-right'} fired`}
                  style={{
                    animationDelay: `${i * .11}s`,
                    cursor: isKSS ? 'none' : 'default',
                    transition: 'all .28s ease',
                  }}
                  onClick={isKSS ? () => onEventClick(ev) : undefined}
                  onMouseEnter={isKSS ? e => {
                    e.currentTarget.style.borderColor = 'rgba(168,85,247,.45)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(168,85,247,.15)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  } : undefined}
                  onMouseLeave={isKSS ? e => {
                    e.currentTarget.style.borderColor = '';
                    e.currentTarget.style.boxShadow = '';
                    e.currentTarget.style.transform = '';
                  } : undefined}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '7px' }}>
                    <span style={{ display: 'flex', color: 'var(--c1)' }}><DynamicIcon name={ev.icon || 'Calendar'} size={24} /></span>
                    <div className="timeline-event-name" style={isKSS ? { color: '#a855f7' } : {}}>{ev.name}</div>
                    {isKSS && (
                      <span style={{
                        marginLeft: 'auto', fontSize: '.6rem', padding: '2px 8px',
                        borderRadius: '10px', background: 'rgba(168,85,247,.12)',
                        color: '#a855f7', border: '1px solid rgba(168,85,247,.3)',
                        fontFamily: "'Space Mono', monospace", whiteSpace: 'nowrap',
                      }}>View Details →</span>
                    )}
                  </div>
                  <div className="timeline-event-date" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DynamicIcon name="Calendar" size={14} /> {ev.date}
                  </div>
                  <p className="timeline-event-desc">{ev.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                    <span className={`timeline-badge ${ev.status}`}>
                      {ev.status === 'completed' ? (
                        <><DynamicIcon name="CheckCircle" size={14} style={{ marginRight: '4px' }} /> Completed</>
                      ) : (
                        <><DynamicIcon name="Calendar" size={14} style={{ marginRight: '4px' }} /> Upcoming</>
                      )}
                    </span>
                    {ev.tags?.map(t => (
                      <span key={t} style={{
                        fontSize: '.68rem', padding: '2px 8px', borderRadius: '10px',
                        background: 'var(--c2a)', color: 'var(--c2)', border: '1px solid var(--c2b)', fontWeight: 600,
                      }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="timeline-item">
            <div className="timeline-dot upcoming" />
            <div className="timeline-card pop-in fired" style={{ textAlign: 'center', color: 'var(--t3)', animationDelay: `${events.length * .11}s` }}>
              <DynamicIcon name="Rocket" size={24} style={{ color: 'var(--c1)', marginBottom: '8px' }} />
              <p style={{ marginTop: '6px', fontSize: '.84rem' }}>More events coming soon. Watch this space!</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

