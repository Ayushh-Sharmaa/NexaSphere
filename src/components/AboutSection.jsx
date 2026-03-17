import { useEffect, useRef } from 'react';

const WHATSAPP_URL = 'https://chat.whatsapp.com/Jjc5cuUKENu0RC1vWSEs20';
const LINKEDIN_URL = 'https://www.linkedin.com/showcase/glbajaj-nexasphere/';

function useRevealAll(id) {
  useEffect(() => {
    const els = document.querySelectorAll(`#${id} .reveal, #${id} .reveal-left, #${id} .reveal-right, #${id} .reveal-scale`);
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [id]);
}

// Neon pill badge
function Pill({ text }) {
  return (
    <span style={{
      display:'inline-block', padding:'4px 14px', borderRadius:'20px',
      background:'rgba(0,212,255,0.08)', border:'1px solid rgba(0,212,255,0.25)',
      color:'var(--cyan)', fontSize:'0.8rem', fontWeight:700,
      letterSpacing:'0.08em', textTransform:'uppercase',
      margin:'4px',
    }}>{text}</span>
  );
}

export default function AboutSection() {
  useRevealAll('section-about');

  const values = ['Innovation','Collaboration','Learning','Growth','Community','Tech'];

  return (
    <section className="section" id="section-about" style={{position:'relative',overflow:'hidden'}}>
      {/* Bg glow */}
      <div style={{
        position:'absolute', top:'50%', left:'50%',
        transform:'translate(-50%,-50%)',
        width:'600px', height:'600px', borderRadius:'50%',
        background:'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)',
        pointerEvents:'none',
      }} />

      <div className="container" style={{position:'relative',zIndex:1}}>
        <h2 className="section-title reveal">About NexaSphere</h2>
        <p className="section-subtitle reveal" style={{transitionDelay:'0.1s'}}>
          Building Tomorrow&apos;s Tech Leaders Today
        </p>

        {/* 2-column layout */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'48px', alignItems:'center', maxWidth:'960px', margin:'0 auto 48px'}}>
          <div>
            <p className="about-text reveal-left" style={{transitionDelay:'0.1s'}}>
              <strong style={{color:'var(--cyan)'}}>NexaSphere</strong> is a student-driven tech
              ecosystem at <strong style={{color:'var(--indigo)'}}>GL Bajaj Group of Institutions, Mathura</strong>.
              Founded to create a thriving community of passionate engineers and innovators,
              we bridge the gap between academic learning and real-world technology.
            </p>
            <p className="about-text reveal-left" style={{marginTop:'16px', transitionDelay:'0.2s'}}>
              From intense hackathons to insightful knowledge sessions, NexaSphere is where
              curiosity meets collaboration. We believe the best learning happens when you
              build, share, and grow together.
            </p>
          </div>

          {/* Animated card */}
          <div className="reveal-right" style={{transitionDelay:'0.15s'}}>
            <div style={{
              background:'var(--bg-card)',
              border:'1px solid var(--border-subtle)',
              borderRadius:'20px', padding:'28px',
              position:'relative', overflow:'hidden',
            }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-cyan)'; e.currentTarget.style.boxShadow='var(--shadow-cyan)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-subtle)'; e.currentTarget.style.boxShadow='none';}}
            >
              <div style={{
                position:'absolute', top:'-20px', right:'-20px', width:'120px', height:'120px',
                background:'radial-gradient(circle, rgba(0,212,255,0.08), transparent)',
                borderRadius:'50%', pointerEvents:'none',
              }} />
              <div style={{fontFamily:'Orbitron,monospace', fontSize:'0.8rem', color:'var(--cyan)', fontWeight:700, letterSpacing:'0.1em', marginBottom:'16px', textTransform:'uppercase'}}>
                Our Values
              </div>
              <div style={{display:'flex', flexWrap:'wrap', gap:'0'}}>
                {values.map(v => <Pill key={v} text={v} />)}
              </div>
              <div style={{marginTop:'20px', paddingTop:'20px', borderTop:'1px solid var(--border-subtle)'}}>
                <div style={{fontFamily:'Orbitron,monospace', fontSize:'0.8rem', color:'var(--indigo)', fontWeight:700, letterSpacing:'0.1em', marginBottom:'8px', textTransform:'uppercase'}}>
                  Proposed by
                </div>
                <div style={{color:'var(--text-secondary)', fontSize:'0.9rem'}}>
                  Tanishk Bansal &amp; Ayush Sharma
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="about-actions reveal" style={{transitionDelay:'0.3s'}}>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
            💬 Join WhatsApp Community
          </a>
          <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="btn btn-linkedin">
            🔗 Follow on LinkedIn
          </a>
        </div>
      </div>
    </section>
  );
}
