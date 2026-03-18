import { useEffect, useRef, useState } from 'react';
import { activities } from '../data/activitiesData';

function useRevealCards(selector) {
  useEffect(() => {
    const cards = document.querySelectorAll(selector);
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.08 }
    );
    cards.forEach(c => obs.observe(c));
    return () => obs.disconnect();
  }, []);
}

function ActivityCard({ activity, index, onNavigate }) {
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [clicking, setClicking] = useState(false);

  const handleMouseMove = e => {
    const card = ref.current; if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    card.style.transform = `translateY(-12px) rotateX(${-y * 14}deg) rotateY(${x * 14}deg) scale(1.02)`;
  };

  const handleMouseLeave = () => {
    if (ref.current) ref.current.style.transform = '';
    setHovered(false);
  };

  const handleClick = () => {
    setClicking(true);
    if (ref.current) {
      ref.current.style.transform = 'scale(0.93)';
      setTimeout(() => { if (ref.current) ref.current.style.transform = ''; }, 150);
    }
    setTimeout(() => { setClicking(false); onNavigate('activity', activity.title); }, 180);
  };

  return (
    <div
      ref={ref}
      className={`activity-card shimmer-card tilt-card reveal reveal-delay-${Math.min(index + 1, 8)}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{ perspective: '800px', cursor: 'pointer' }}
    >
      {/* Card number */}
      <div className="card-number">{String(index + 1).padStart(2, '0')}</div>

      <div className="activity-icon">{activity.icon}</div>
      <div className="activity-title">{activity.title}</div>
      <p className="activity-desc">{activity.description}</p>
      <div className="activity-cta">
        <span>Explore</span>
        <span style={{ transition: 'transform 0.25s', transform: hovered ? 'translateX(4px)' : '' }}>→</span>
      </div>
    </div>
  );
}

export default function ActivitiesSection({ onNavigate }) {
  useRevealCards('#section-activities .activity-card');

  useEffect(() => {
    const els = document.querySelectorAll('#section-activities .reveal:not(.activity-card)');
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <section className="section" id="section-activities">
      <div className="container">
        <h2 className="section-title reveal">Our Activities</h2>
        <p className="section-subtitle reveal" style={{ transitionDelay: '0.1s' }}>
          Click any activity to explore sessions &amp; events
        </p>
        <div className="activity-grid">
          {activities.map((a, i) => (
            <ActivityCard key={a.id} activity={a} index={i} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    </section>
  );
}
