import { useEffect, useRef } from 'react';
import { activities } from '../data/activitiesData';

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function ActivityCard({ activity, delay }) {
  const ref = useRef(null);

  // 3D tilt effect
  const handleMouseMove = (e) => {
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `translateY(-8px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg)`;
  };
  const handleMouseLeave = () => {
    if (ref.current) ref.current.style.transform = '';
  };

  return (
    <div
      ref={ref}
      className={`activity-card shimmer-card tilt-card reveal reveal-delay-${delay}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: '600px' }}
    >
      <div className="activity-icon">{activity.icon}</div>
      <div className="activity-title">{activity.title}</div>
      <p className="activity-desc">{activity.description}</p>
    </div>
  );
}

export default function ActivitiesSection() {
  const titleRef = useReveal();

  // Reveal each card
  useEffect(() => {
    const cards = document.querySelectorAll('#section-activities .activity-card');
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    cards.forEach((c) => obs.observe(c));
    return () => obs.disconnect();
  }, []);

  return (
    <section className="section" id="section-activities">
      <div className="container">
        <h2 className="section-title reveal" ref={titleRef}>Our Activities</h2>
        <p className="section-subtitle reveal" style={{ transitionDelay: '0.1s' }}>
          Where Learning Meets Innovation
        </p>
        <div className="activity-grid">
          {activities.map((a, i) => (
            <ActivityCard key={a.id} activity={a} delay={Math.min((i % 4) + 1, 6)} />
          ))}
        </div>
      </div>
    </section>
  );
}
