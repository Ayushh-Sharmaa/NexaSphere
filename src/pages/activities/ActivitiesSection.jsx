import { useEffect, useRef } from 'react';
import { activities } from '../../data/activitiesData';
import { activityPages } from '../../data/activities/index';

/* Anti-gravity delays — same pattern as team cards */
const AG_DELAYS = [0, -2.1, -4.2, -1.0, -3.3, -5.5, -0.7, -6.1];

function ActivityCard({ a, idx, onNav }) {
  const ref      = useRef(null);
  const agDelay  = AG_DELAYS[idx % AG_DELAYS.length];

  // Check if this activity has any content to show
  const detail = activityPages[a.title];
  const hasContent = detail && (
    (detail.conductedEvents && detail.conductedEvents.length > 0) ||
    (detail.upcomingEvents  && detail.upcomingEvents.length  > 0)
  );

  const onMove = e => {
    const c = ref.current; if (!c) return;
    const rect = c.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - .5;
    const y = (e.clientY - rect.top)  / rect.height - .5;
    /* pause float while tilting */
    c.style.animationPlayState = 'paused';
    c.style.transform = `translateY(-16px) rotateX(${-y * 16}deg) rotateY(${x * 16}deg) scale(1.04)`;
  };

  const onLeave = () => {
    const c = ref.current; if (!c) return;
    c.style.transform = '';
    c.style.animationPlayState = '';
  };

  const click = () => {
    if (!hasContent) return;
    const c = ref.current;
    if (c) { c.style.transform = 'scale(.92)'; setTimeout(() => { c.style.transform = ''; }, 130); }
    setTimeout(() => onNav('activity', a.title), 160);
  };

  return (
    <div
      ref={ref}
      className="activity-card shimmer mag-card"
      style={{
        cursor: hasContent ? 'pointer' : 'default',
        perspective: '800px',
        animation: `ag 7s ease-in-out ${agDelay}s infinite`,
        willChange: 'transform',
      }}
      onMouseMove={hasContent ? onMove : undefined}
      onMouseLeave={hasContent ? onLeave : undefined}
      onClick={click}
    >
      <div className="card-accent-line"/>
      <div className="card-num">{String(idx + 1).padStart(2, '0')}</div>
      <div className="activity-icon">{a.icon}</div>
      <div className="activity-title">{a.title}</div>
      <p className="activity-desc">{a.description}</p>
      {hasContent ? (
        <div className="activity-cta"><span>Explore</span><span>→</span></div>
      ) : (
        <div className="activity-cta" style={{ opacity: 0.45, cursor: 'default' }}>
          <span>Coming Soon</span>
        </div>
      )}
      <div className="corner-tl"/><div className="corner-br"/>
    </div>
  );
}

export default function ActivitiesSection({ onNavigate }) {
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('fired'); obs.unobserve(e.target); }
      });
    }, { threshold: .08 });
    document.querySelectorAll('#section-activities .pop-word, #section-activities .pop-in')
      .forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <section className="section" id="section-activities">
      <div className="container">
        <div className="reveal-stagger">
          <h2 className="section-title pop-word">Our Activities</h2>
          <p className="section-subtitle pop-in" style={{ animationDelay: '.1s' }}>
            Click any activity to explore sessions &amp; events
          </p>
        </div>
        <div className="activity-grid cin-container">
          {activities.map((a, i) => (
            <ActivityCard key={a.id} a={a} idx={i} onNav={onNavigate}/>
          ))}
        </div>
      </div>
    </section>
  );
}

