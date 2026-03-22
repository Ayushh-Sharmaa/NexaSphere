import { useEffect, useRef } from 'react';
import { activities } from '../../data/activitiesData';

function ActivityCard({ a, idx, onNav }) {
  const ref = useRef(null);

  const onMove = e => {
    const c = ref.current; if (!c) return;
    const rect = c.getBoundingClientRect();
    const x = (e.clientX - rect.left)/rect.width  - .5;
    const y = (e.clientY - rect.top )/rect.height - .5;
    c.style.transform = `translateY(-14px) rotateX(${-y*15}deg) rotateY(${x*15}deg) scale(1.03)`;
  };
  const onLeave = () => { if(ref.current) ref.current.style.transform=''; };
  const click = () => {
    const c = ref.current;
    if(c){c.style.transform='scale(.93)';setTimeout(()=>{c.style.transform='';},140);}
    setTimeout(()=>onNav('activity',a.title),160);
  };

  return (
    <div ref={ref}
      className="activity-card shimmer tilt pop-flip"
      style={{cursor:'pointer',perspective:'800px'}}
      onMouseMove={onMove} onMouseLeave={onLeave} onClick={click}
    >
      <div className="card-num">{String(idx+1).padStart(2,'0')}</div>
      <div className="activity-icon">{a.icon}</div>
      <div className="activity-title">{a.title}</div>
      <p className="activity-desc">{a.description}</p>
      <div className="activity-cta"><span>Explore</span><span>→</span></div>
      <div className="corner-tl"/><div className="corner-br"/>
    </div>
  );
}

export default function ActivitiesSection({ onNavigate }) {
  useEffect(()=>{
    const obs=new IntersectionObserver(entries=>{
      entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('fired');obs.unobserve(e.target);}});
    },{threshold:.09});
    document.querySelectorAll('#section-activities .pop-flip,#section-activities .pop-in,#section-activities .pop-word').forEach(el=>obs.observe(el));
    return()=>obs.disconnect();
  },[]);

  return (
    <section className="section" id="section-activities">
      <div className="container">
        <h2 className="section-title pop-word">Our Activities</h2>
        <p className="section-subtitle pop-in" style={{animationDelay:'.1s'}}>Click any activity to explore sessions &amp; events</p>
        <div className="activity-grid cin-container">
          {activities.map((a,i)=><ActivityCard key={a.id} a={a} idx={i} onNav={onNavigate}/>)}
        </div>
      </div>
    </section>
  );
}
