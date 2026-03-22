import { useEffect, useRef } from 'react';
import { activities } from '../data/activitiesData';

const activityDetails = {
  'Hackathon': {
    color: '#00d4ff',
    longDesc: 'Intense 24–48 hour coding marathons where teams build innovative solutions to real-world problems under time pressure. Participants form cross-functional teams, brainstorm ideas, design architectures, and ship working prototypes — all under the clock.',
    highlights: ['Team-based challenges', 'Mentorship from seniors', 'Real problem statements', 'Prizes & recognition'],
    skills: ['Full-Stack Dev', 'Problem Solving', 'Team Collaboration', 'System Design'],
  },
  'Codathon': {
    color: '#7b6fff',
    longDesc: 'Competitive programming contests that test your algorithmic thinking, data structures knowledge, and code efficiency. From greedy to dynamic programming — sharpen your edge for placements and ICPC-style rounds.',
    highlights: ['Timed challenge rounds', 'Multi-difficulty problems', 'Leaderboard ranking', 'Individual & team modes'],
    skills: ['Algorithms', 'DSA', 'Competitive Programming', 'Optimization'],
  },
  'Ideathon': {
    color: '#bd5cff',
    longDesc: 'Creativity-first competition where the best idea wins — no code required. Pitch your innovation, back it with research, and present a compelling case. Perfect for thinkers, designers, and business-minded builders.',
    highlights: ['Pitching rounds', 'Expert panel judging', 'Market research focus', 'Cross-discipline teams'],
    skills: ['Creative Thinking', 'Presentation', 'Research', 'Product Design'],
  },
  'Workshop': {
    color: '#ff9500',
    longDesc: 'Hands-on learning sessions on cutting-edge tools, frameworks, and emerging technologies. Led by experienced peers, alumni, or industry guests — every workshop gets you building something real by the end.',
    highlights: ['Live coding sessions', 'Take-home projects', 'Q&A with experts', 'Beginner to advanced tracks'],
    skills: ['New Technologies', 'Practical Skills', 'Tool Mastery', 'Applied Learning'],
  },
  'Insight Session': {
    color: '#a855f7',
    longDesc: 'Deep-dive talks and peer-to-peer knowledge sharing where every member is both teacher and student. Explore industry trends, career paths, emerging research, and the big ideas shaping tomorrow\'s technology landscape.',
    highlights: ['Peer presentations', 'Industry trend analysis', 'Career guidance', 'Open discussions'],
    skills: ['Communication', 'Research', 'Critical Thinking', 'Domain Knowledge'],
  },
  'Open Source Day': {
    color: '#00ff9d',
    longDesc: 'Dedicated events encouraging real contributions to open-source projects. Learn Git workflows, find your first issue, submit PRs, and become part of the global developer community — all in a guided, supportive environment.',
    highlights: ['First-PR guidance', 'Project selection help', 'Git & GitHub deep dive', 'Community recognition'],
    skills: ['Git', 'Open Source', 'Code Review', 'Documentation'],
  },
  'Tech Debate': {
    color: '#ff2d78',
    longDesc: 'Structured debates on the most controversial topics in tech — AI vs Human Jobs, Native vs Cross-Platform, SQL vs NoSQL. Sharpen your ability to defend a position, handle rebuttals, and communicate technical ideas clearly.',
    highlights: ['Structured format', 'Expert moderation', 'Both sides argued', 'Audience Q&A'],
    skills: ['Public Speaking', 'Critical Thinking', 'Technical Communication', 'Argumentation'],
  },
};

function ActivityCard({ a, idx, onNavigate }) {
  const ref = useRef(null);
  const details = activityDetails[a.title] || {};

  const onMove = e => {
    const c = ref.current; if (!c) return;
    const rect = c.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - .5;
    const y = (e.clientY - rect.top) / rect.height - .5;
    c.style.transform = `translateY(-8px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg) scale(1.02)`;
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = ''; };
  const click = () => {
    const c = ref.current;
    if (c) { c.style.transform = 'scale(.95)'; setTimeout(() => { c.style.transform = ''; }, 140); }
    setTimeout(() => onNavigate('activity', a.title), 160);
  };

  return (
    <div ref={ref}
      onClick={click}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        background: 'var(--card)',
        border: `1px solid var(--bdr)`,
        borderRadius: 'var(--r3)',
        padding: '28px 24px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        perspective: '800px',
        transition: 'border-color .28s, box-shadow .28s',
        animation: `ag 7s ease-in-out ${[-0, -2.1, -4.2, -1.0, -3.3, -5.5, -0.7][idx % 7]}s infinite`,
      }}
    >
      {/* Color accent top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: details.color || 'var(--c1)',
        borderRadius: 'var(--r3) var(--r3) 0 0',
      }} />

      <div style={{ fontSize: '2.4rem', marginBottom: '14px' }}>{a.icon}</div>
      <div style={{
        fontFamily: "'Orbitron', monospace", fontSize: '.8rem', fontWeight: 700,
        color: details.color || 'var(--c1)', marginBottom: '10px', letterSpacing: '.06em',
        textTransform: 'uppercase',
      }}>{a.title}</div>
      <p style={{ fontSize: '.88rem', color: 'var(--t2)', lineHeight: 1.72, marginBottom: '18px' }}>
        {details.longDesc || a.description}
      </p>

      {/* Skills */}
      {details.skills && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
          {details.skills.map(s => (
            <span key={s} style={{
              fontSize: '.62rem', padding: '3px 9px', borderRadius: '20px',
              background: `${details.color}18`, color: details.color,
              border: `1px solid ${details.color}35`,
              fontFamily: "'Space Mono', monospace", fontWeight: 600,
            }}>{s}</span>
          ))}
        </div>
      )}

      {/* Highlights */}
      {details.highlights && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 18px' }}>
          {details.highlights.map(h => (
            <li key={h} style={{ fontSize: '.8rem', color: 'var(--t2)', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: details.color, fontWeight: 700 }}>→</span> {h}
            </li>
          ))}
        </ul>
      )}

      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        fontSize: '.72rem', fontWeight: 700, color: details.color || 'var(--c1)',
        textTransform: 'uppercase', letterSpacing: '.1em', opacity: .7,
        transition: 'opacity .2s',
      }}>
        <span>View Sessions</span><span>→</span>
      </div>

      <div style={{ position: 'absolute', top: 0, left: 0, width: '16px', height: '16px', borderTop: `1.5px solid ${details.color || 'var(--c1)'}`, borderLeft: `1.5px solid ${details.color || 'var(--c1)'}`, opacity: .5 }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: '16px', height: '16px', borderBottom: `1.5px solid ${details.color || 'var(--c1)'}`, borderRight: `1.5px solid ${details.color || 'var(--c1)'}`, opacity: .5 }} />
    </div>
  );
}

export default function ActivitiesPage({ onNavigate, onBack }) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('fired'); obs.unobserve(e.target); } });
    }, { threshold: 0, rootMargin: '0px 0px -10px 0px' });
    document.querySelectorAll('#activities-page .pop-in, #activities-page .pop-word').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div id="activities-page" style={{ minHeight: '100vh', padding: '60px 0 100px' }}>
      {/* Hero banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,212,255,.06), rgba(123,111,255,.04))',
        borderBottom: '1px solid var(--bdr)',
        padding: '60px 0 50px',
        textAlign: 'center',
        marginBottom: '60px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0,212,255,.04) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <button onClick={onBack} style={{
          position: 'absolute', top: '24px', left: '28px',
          background: 'var(--card)', border: '1px solid var(--bdr)',
          borderRadius: '50px', padding: '7px 16px',
          color: 'var(--t2)', fontSize: '.8rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px',
          fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
          transition: 'all .2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c1)'; e.currentTarget.style.color = 'var(--c1)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bdr)'; e.currentTarget.style.color = 'var(--t2)'; }}
        >← Back</button>

        <span className="cin-section-label pop-in">NexaSphere · GL Bajaj</span>
        <h1 className="section-title pop-word" style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)' }}>Our Activities</h1>
        <p className="section-subtitle pop-in" style={{ animationDelay: '.1s', maxWidth: '580px', margin: '0 auto' }}>
          Every format is designed to sharpen a different skill. Explore what excites you — then dive in.
        </p>
      </div>

      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px',
        }}>
          {activities.map((a, i) => (
            <ActivityCard key={a.id} a={a} idx={i} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    </div>
  );
}
