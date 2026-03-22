import { useEffect } from 'react';
import { events } from '../../data/eventsData';

export default function EventsSection() {
  useEffect(()=>{
    const obs=new IntersectionObserver(entries=>{
      entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('fired');obs.unobserve(e.target);}});
    },{threshold:.1});
    document.querySelectorAll('#section-events .pop-in,#section-events .pop-left,#section-events .pop-right,#section-events .pop-word').forEach(el=>obs.observe(el));
    return()=>obs.disconnect();
  },[]);

  return (
    <section className="section" id="section-events">
      <div className="container">
        <h2 className="section-title pop-word">Our Events</h2>
        <p className="section-subtitle pop-in" style={{animationDelay:'.1s'}}>Where Ideas Come to Life</p>
        <div className="events-timeline">
          {events.map((ev,i)=>(
            <div className="timeline-item" key={ev.id}>
              <div className={`timeline-dot${ev.status==='upcoming'?' upcoming':''}`}/>
              <div className={`timeline-card shimmer ${i%2===0?'pop-left':'pop-right'}`} style={{animationDelay:`${i*.11}s`}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'7px'}}>
                  <span style={{fontSize:'1.4rem'}}>{ev.icon}</span>
                  <div className="timeline-event-name">{ev.name}</div>
                </div>
                <div className="timeline-event-date">📅 {ev.date}</div>
                <p className="timeline-event-desc">{ev.description}</p>
                <div style={{display:'flex',alignItems:'center',gap:'7px',flexWrap:'wrap'}}>
                  <span className={`timeline-badge ${ev.status}`}>{ev.status==='completed'?'✅ Completed':'🔜 Upcoming'}</span>
                  {ev.tags?.map(t=>(
                    <span key={t} style={{fontSize:'.68rem',padding:'2px 8px',borderRadius:'10px',background:'var(--c2a)',color:'var(--c2)',border:'1px solid var(--c2b)',fontWeight:600}}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {events.length>0&&(
            <div className="timeline-item">
              <div className="timeline-dot upcoming"/>
              <div className="timeline-card pop-in" style={{textAlign:'center',color:'var(--t3)'}}>
                <span style={{fontSize:'1.3rem'}}>🚀</span>
                <p style={{marginTop:'6px',fontSize:'.84rem'}}>More events are being planned. Watch this space!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
