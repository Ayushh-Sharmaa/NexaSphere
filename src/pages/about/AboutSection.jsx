import { useEffect, useState } from 'react';

const WHATSAPP       = 'https://chat.whatsapp.com/Jjc5cuUKENu0RC1vWSEs20';
const LINKEDIN       = 'https://www.linkedin.com/showcase/glbajaj-nexasphere/';
const NEXASPHERE_EMAIL = 'nexasphere@glbajajgroup.org';

const values = ['Innovation','Collaboration','Learning','Growth','Community','Technology','Career','Mentorship'];

export default function AboutSection() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(()=>{
    const obs=new IntersectionObserver(entries=>{
      entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('fired');obs.unobserve(e.target);}});
    },{threshold:.09});
    document.querySelectorAll('#section-about .pop-in,#section-about .pop-left,#section-about .pop-right,#section-about .pop-word').forEach(el=>obs.observe(el));
    return()=>obs.disconnect();
  },[]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <section className="section" id="section-about" style={{position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'480px',height:'480px',borderRadius:'50%',background:'radial-gradient(circle,rgba(123,111,255,.03) 0%,transparent 70%)',pointerEvents:'none'}}/>
      <div className="container" style={{position:'relative',zIndex:1}}>
        <div className="ns-reveal">
          <h2 className="section-title pop-word">About NexaSphere</h2>
          <p className="section-subtitle pop-in" style={{animationDelay:'.1s'}}>Building Tomorrow&apos;s Tech Leaders Today</p>
        </div>

        <div style={{
          display:'grid',
          gridTemplateColumns:isMobile ? '1fr' : '1fr 1fr',
          gap:isMobile ? '24px' : '44px',
          alignItems:'center',
          maxWidth:'920px',
          margin:'0 auto 44px'
        }}>
          <div className="ns-reveal-left">
            <p className="about-text pop-left" style={{animationDelay:'.08s'}}>
              <strong style={{color:'var(--c1)'}}>NexaSphere</strong> is a student-driven tech ecosystem at{' '}
              <strong style={{color:'var(--c2)'}}>GL Bajaj Group of Institutions, Mathura</strong>.
              Founded to bridge the gap between academic learning and real-world technology, we run hackathons, workshops, knowledge-sharing sessions, and career guidance events.
            </p>
            <p className="about-text pop-left" style={{marginTop:'12px',animationDelay:'.16s'}}>
              From peer-led Knowledge Sharing Sessions and hands-on workshops to Industry Insider career guidance and competitive hackathons — NexaSphere runs events that connect curiosity with real opportunity, all year round.
            </p>
            
            <div className="pop-left" style={{marginTop:'16px',animationDelay:'.22s'}}>
              <div style={{fontFamily:'Orbitron,monospace',fontSize:'.7rem',color:'var(--c1)',fontWeight:700,letterSpacing:'.1em',marginBottom:'4px',textTransform:'uppercase'}}>Contact Us</div>
              <a href={`mailto:${NEXASPHERE_EMAIL}`} style={{color:'var(--c1)',fontSize:'.88rem',fontWeight:600}}>{NEXASPHERE_EMAIL}</a>
            </div>
          </div>

          <div className="pop-right ag" style={{animationDelay:'.14s'}}>
            <div className="about-card-inner"
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--c1b)';e.currentTarget.style.boxShadow='var(--sh1)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='';e.currentTarget.style.boxShadow='';}}
            >
              <div style={{position:'absolute',top:'-14px',right:'-14px',width:'90px',height:'90px',background:'radial-gradient(circle,rgba(0,212,255,.07),transparent)',borderRadius:'50%',pointerEvents:'none'}}/>
              <div className="corner-tl"/><div className="corner-br"/>
              <div style={{fontFamily:'Orbitron,monospace',fontSize:'.7rem',color:'var(--c1)',fontWeight:700,letterSpacing:'.1em',marginBottom:'13px',textTransform:'uppercase'}}>Our Values</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                {values.map(v=>(
                  <span key={v} style={{
                    display:'inline-flex',alignItems:'center',
                    padding:'4px 12px',borderRadius:'50px',
                    background:'var(--c1a)',border:'1px solid var(--c1b)',
                    color:'var(--c1)',fontSize:'.74rem',fontWeight:700,
                    letterSpacing:'.06em',textTransform:'uppercase',cursor:'default',
                    transition:'all .18s',
                  }}
                    onMouseEnter={e=>{e.target.style.background='var(--c1b)';e.target.style.transform='translateY(-2px)';}}
                    onMouseLeave={e=>{e.target.style.background='var(--c1a)';e.target.style.transform='';}}
                  >{v}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="about-actions pop-in" style={{animationDelay:'.28s'}}>
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">💬 Join WhatsApp</a>
          <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" className="btn btn-linkedin">🔗 LinkedIn</a>
          <a href={`mailto:${NEXASPHERE_EMAIL}`} className="btn btn-outline">📧 Email Us</a>
        </div>
      </div>
    </section>
  );
}

