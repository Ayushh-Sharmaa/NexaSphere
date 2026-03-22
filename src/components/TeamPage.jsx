import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { teamMembers } from '../data/teamData';
import TeamMemberModal from './TeamMemberModal';

const CORE_TEAM_FORM = 'https://forms.gle/4M5w1dfD6un6tmGz5';

function MemberCard({ member, idx, onClick }) {
  const ref = useRef(null);
  const agDelays = [-0.0, -2.1, -4.2, -1.0, -3.3, -5.5, -0.7, -6.1, -2.8, -4.9, -1.6, -3.8];

  const onMove = e => {
    const c = ref.current; if (!c) return;
    const rect = c.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - .5;
    const y = (e.clientY - rect.top) / rect.height - .5;
    c.style.animationPlayState = 'paused';
    c.style.transform = `translateY(-14px) rotateX(${-y * 18}deg) rotateY(${x * 18}deg) scale(1.06)`;
  };
  const onLeave = () => {
    const c = ref.current; if (!c) return;
    c.style.transform = ''; c.style.animationPlayState = '';
  };
  const click = () => {
    const c = ref.current;
    if (c) { c.style.transform = 'scale(.9)'; setTimeout(() => { c.style.transform = ''; }, 140); }
    setTimeout(() => onClick(member), 110);
  };

  return (
    <div ref={ref}
      className="team-card shimmer"
      style={{
        cursor: 'none', perspective: '800px',
        animation: `ag 7s ease-in-out ${agDelays[idx % 12]}s infinite`,
        willChange: 'transform',
        animationFillMode: 'both',
        opacity: 1,
      }}
      onMouseMove={onMove} onMouseLeave={onLeave} onClick={click}
      role="button" tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') click(); }}
    >
      <div className="team-card-photo-wrap">
        <img src={member.photo} alt={member.name} className="team-card-photo" />
      </div>
      <div className="team-card-name">{member.name}</div>
      <div className="team-card-role">{member.role}</div>
      <div className="team-card-chips">
        <span className="chip-branch">{member.branch}</span>
        <span className="chip-section">§{member.section}</span>
      </div>
      <div className="team-card-hint">Click to view ↗</div>
      <div className="corner-tl" /><div className="corner-br" />
    </div>
  );
}

export default function TeamPage({ onBack }) {
  const [sel, setSel] = useState(null);

  useEffect(() => { window.scrollTo({ top: 0 }); }, []);

  const organiser = teamMembers.filter(m => m.role === 'Organiser' || m.role === 'Co-organiser');
  const coreTeam  = teamMembers.filter(m => m.role === 'Core Team Member');

  return (
    <div id="team-page" style={{ minHeight: '100vh', padding: '0 0 100px' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(123,111,255,.07), rgba(189,92,255,.04))',
        borderBottom: '1px solid var(--bdr)',
        padding: '70px 0 50px',
        textAlign: 'center',
        marginBottom: '60px',
        position: 'relative', overflow: 'hidden',
      }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: `${200 + i * 100}px`, height: `${200 + i * 100}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(123,111,255,${.04 - i * .01}) 0%, transparent 70%)`,
            left: `${[15, 70, 45][i]}%`, top: `${[30, 20, 70][i]}%`,
            transform: 'translate(-50%,-50%)',
            animation: `ag ${6 + i * 2}s ease-in-out ${-i * 2}s infinite`,
            pointerEvents: 'none',
          }} />
        ))}

        <button onClick={onBack} style={{
          position: 'absolute', top: '24px', left: '28px',
          background: 'var(--card)', border: '1px solid var(--bdr)',
          borderRadius: '50px', padding: '7px 16px',
          color: 'var(--t2)', fontSize: '.8rem', cursor: 'none',
          display: 'flex', alignItems: 'center', gap: '6px',
          fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c2)'; e.currentTarget.style.color = 'var(--c2)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bdr)'; e.currentTarget.style.color = 'var(--t2)'; }}
        >← Back</button>

        <span className="cin-section-label" style={{ display: 'block', textAlign: 'center', marginBottom: '8px', fontFamily: "'Space Mono', monospace", fontSize: '.6rem', color: 'var(--t3)', letterSpacing: '.3em', textTransform: 'uppercase' }}>
          GL Bajaj Group of Institutions · Mathura
        </span>
        <h1 className="section-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)' }}>Core Team</h1>
        <p className="section-subtitle" style={{ maxWidth: '500px', margin: '0 auto' }}>
          The minds and hands behind NexaSphere — meet the people driving the vision forward.
        </p>
      </div>

      <div className="container">
        {/* Leadership */}
        <div style={{ marginBottom: '52px' }}>
          <div style={{
            fontFamily: "'Orbitron', monospace", fontSize: '.68rem', fontWeight: 700,
            color: 'var(--c2)', letterSpacing: '.2em', textTransform: 'uppercase',
            textAlign: 'center', marginBottom: '24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, var(--bdr2))' }} />
            Leadership
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, var(--bdr2), transparent)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: '16px', maxWidth: '500px', margin: '0 auto' }}>
            {organiser.map((m, i) => <MemberCard key={m.id} member={m} idx={i} onClick={setSel} />)}
          </div>
        </div>

        {/* Core Team */}
        <div style={{ marginBottom: '52px' }}>
          <div style={{
            fontFamily: "'Orbitron', monospace", fontSize: '.68rem', fontWeight: 700,
            color: 'var(--c1)', letterSpacing: '.2em', textTransform: 'uppercase',
            textAlign: 'center', marginBottom: '24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, var(--bdr2))' }} />
            Core Members
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, var(--bdr2), transparent)' }} />
          </div>
          <div className="team-grid">
            {coreTeam.map((m, i) => <MemberCard key={m.id} member={m} idx={i + 2} onClick={setSel} />)}
          </div>
        </div>

        {/* Join CTA */}
        <div style={{
          textAlign: 'center', padding: '32px',
          background: 'var(--card)', border: '1px solid var(--bdr)',
          borderRadius: 'var(--r3)', maxWidth: '520px', margin: '0 auto',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--c1), var(--c2), var(--c3))' }} />
          <div className="corner-tl" /><div className="corner-br" />
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🚀</div>
          <h3 style={{ fontFamily: 'Orbitron,monospace', fontSize: '1rem', fontWeight: 700, color: 'var(--c1)', marginBottom: '8px', letterSpacing: '.05em' }}>
            Want to Join the Core Team?
          </h3>
          <p style={{ color: 'var(--t2)', fontSize: '.88rem', marginBottom: '18px', lineHeight: 1.65 }}>
            We&apos;re looking for passionate students to drive NexaSphere forward. Fill in the form and we&apos;ll reach out!
          </p>
          <a href={CORE_TEAM_FORM} target="_blank" rel="noopener noreferrer" className="btn btn-join btn-ripple">
            ✨ Apply Now
          </a>
        </div>
      </div>

      {sel && createPortal(
        <TeamMemberModal member={sel} onClose={() => setSel(null)} />,
        document.body
      )}
    </div>
  );
}
