import { useEffect, useState, useRef } from 'react';

function Typewriter({ text, speed = 18 }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) { setDone(true); clearInterval(t); }
    }, speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return (
    <span>
      {displayed}
      {!done && <span style={{ animation: 'blink 0.7s step-end infinite', color: 'var(--c1)' }}>|</span>}
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </span>
  );
}

function StatCard({ label, value, color = '#00d4ff' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const num = parseInt(value);
        if (isNaN(num)) { setCount(value); return; }
        let cur = 0;
        const t = setInterval(() => {
          cur += Math.ceil(num / 30);
          if (cur >= num) { setCount(num); clearInterval(t); }
          else setCount(cur);
        }, 30);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [value]);

  return (
    <div ref={ref} style={{
      background: 'var(--card)', border: `1px solid ${color}30`,
      borderRadius: 'var(--r2)', padding: '20px 16px', textAlign: 'center',
      boxShadow: `0 0 24px ${color}12`,
    }}>
      <div style={{
        fontFamily: "'Orbitron', monospace", fontSize: '1.8rem', fontWeight: 900,
        color, marginBottom: '6px',
      }}>{count}{isNaN(parseInt(value)) ? '' : ''}</div>
      <div style={{ fontSize: '.72rem', color: 'var(--t3)', letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: "'Space Mono', monospace" }}>{label}</div>
    </div>
  );
}

const KSS_DATA = {
  id: 'kss-march-2025',
  name: 'KSS — Knowledge Sharing Session',
  shortName: 'KSS #153',
  date: 'March 14, 2025',
  location: 'GL Bajaj Group of Institutions, Mathura',
  status: 'completed',
  icon: '🧠',
  color: '#a855f7',
  tagline: 'They came. They listened. They left thinking differently.',
  description: "NexaSphere's inaugural Knowledge Sharing Session — an interactive peer-to-peer learning event where members presented on emerging tech topics, fostering curiosity, collaboration, and community building within the club.",
  overview: `Knowledge Sharing Session #153 on the topic "Impact of AI" wrapped up at GL Bajaj Group of Institutions, Mathura — and what a session it was! 🧠💡

Think about it — today, even deciding whether to have chai ☕ or coffee is being influenced by AI. Recommendation engines, smart assistants, predictive habits... AI has quietly slipped into every corner of our lives. And our presenters made sure we felt every bit of that reality.

From powerful technical deep-dives to thought-provoking reflections on AI's societal role, every speaker brought something unique. The energy in the room was electric — questions flew, ideas collided, and minds were genuinely stretched.`,
  stats: [
    { label: 'Presenters', value: '3', color: '#a855f7' },
    { label: 'Video Presenters', value: '2', color: '#7b6fff' },
    { label: 'Volunteers', value: '5', color: '#00d4ff' },
    { label: 'Session No.', value: '153', color: '#ff9500' },
  ],
  topics: [
    {
      title: 'Impact of AI on Everyday Life',
      speaker: 'Ankit Singh',
      role: 'Presenter',
      summary: 'Explored how AI recommendation engines, smart assistants, and predictive systems have silently embedded themselves into our daily decisions — from what we watch to what we buy.',
      icon: '🤖',
    },
    {
      title: 'AI in Healthcare & Education',
      speaker: 'Aryan Singh',
      role: 'Presenter',
      summary: 'Covered the transformative role AI is playing in early disease detection, personalized learning platforms, and how it is reshaping both the medical and education sectors.',
      icon: '🏥',
    },
    {
      title: 'Ethical Dimensions of AI',
      speaker: 'Swayam Dwivedi',
      role: 'Presenter',
      summary: 'Examined the pressing ethical questions around AI bias, privacy, deepfakes, and the responsibility of developers to build systems that serve humanity fairly.',
      icon: '⚖️',
    },
  ],
  volunteers: [
    'Ayush Sharma', 'Tanishk Bansal', 'Tushar Goswami', 'Vartika Sharma', 'Astha Shukla',
  ],
  hashtags: [
    '#KSS153', '#ImpactOfAI', '#GLBajaj', '#KnowledgeSharingSession',
    '#NexaSphere', '#StudentLeaders', '#AIForAll', '#AKTU', '#Mathura', '#FindYourSpark',
  ],
  tags: ['Learning', 'Community', 'Tech', 'AI'],
};

export default function KSSEventPage({ onBack }) {
  const ev = KSS_DATA;
  const color = ev.color;

  useEffect(() => { window.scrollTo({ top: 0 }); }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Hero */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: `linear-gradient(160deg, ${color}14 0%, transparent 60%)`,
        borderBottom: '1px solid var(--bdr)',
        padding: '70px 0 60px',
        textAlign: 'center',
      }}>
        {/* Orbs */}
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: `${120 + i * 60}px`, height: `${120 + i * 60}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color}${['18', '10', '08', '05'][i]} 0%, transparent 70%)`,
            left: `${[10, 60, 80, 30][i]}%`, top: `${[20, 60, 10, 70][i]}%`,
            transform: 'translate(-50%,-50%)',
            animation: `ag ${6 + i}s ease-in-out ${-i * 2}s infinite`,
            pointerEvents: 'none',
          }} />
        ))}

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <button onClick={onBack} style={{
            position: 'absolute', top: 0, left: '28px',
            background: 'var(--card)', border: '1px solid var(--bdr)',
            borderRadius: '50px', padding: '7px 16px',
            color: 'var(--t2)', fontSize: '.8rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.color = color; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bdr)'; e.currentTarget.style.color = 'var(--t2)'; }}
          >← Back to Events</button>

          <div style={{ fontSize: '4rem', marginBottom: '16px', filter: `drop-shadow(0 0 20px ${color}80)` }}>{ev.icon}</div>
          <div style={{ fontSize: '.72rem', color, letterSpacing: '.3em', fontFamily: "'Space Mono', monospace", textTransform: 'uppercase', marginBottom: '12px' }}>
            {ev.date} · {ev.location}
          </div>
          <h1 style={{
            fontFamily: "'Orbitron', monospace", fontSize: 'clamp(1.6rem, 4vw, 2.8rem)',
            fontWeight: 900, color: 'var(--t1)', marginBottom: '12px', lineHeight: 1.2,
          }}>
            <Typewriter text={ev.name} speed={22} />
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--t2)', fontStyle: 'italic', marginBottom: '20px' }}>
            "{ev.tagline}"
          </p>

          {/* Status + Tags */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <span style={{
              padding: '4px 14px', borderRadius: '20px', fontSize: '.72rem', fontWeight: 700,
              background: 'rgba(0,255,157,.09)', color: '#00ff9d', border: '1px solid rgba(0,255,157,.2)',
              letterSpacing: '.06em', textTransform: 'uppercase',
            }}>✅ Completed</span>
            {ev.tags.map(t => (
              <span key={t} style={{
                padding: '4px 14px', borderRadius: '20px', fontSize: '.72rem', fontWeight: 700,
                background: `${color}15`, color, border: `1px solid ${color}35`,
                letterSpacing: '.06em',
              }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '60px 28px 100px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px', marginBottom: '60px' }}>
          {ev.stats.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Overview */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--bdr)',
          borderRadius: 'var(--r3)', padding: '36px', marginBottom: '40px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${color}, #7b6fff)` }} />
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '.72rem', color, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: '18px' }}>
            📋 Session Overview
          </div>
          {ev.overview.split('\n\n').map((para, i) => (
            <p key={i} style={{ fontSize: '.94rem', color: 'var(--t2)', lineHeight: 1.82, marginBottom: '14px' }}>{para}</p>
          ))}
        </div>

        {/* Topics */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontFamily: "'Orbitron', monospace", fontSize: '1.1rem', fontWeight: 700,
            color: 'var(--t1)', marginBottom: '24px',
            borderLeft: `3px solid ${color}`, paddingLeft: '14px',
          }}>Topics Presented</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
            {ev.topics.map((topic, i) => (
              <div key={i} style={{
                background: 'var(--card)', border: '1px solid var(--bdr)',
                borderRadius: 'var(--r2)', padding: '24px',
                position: 'relative', overflow: 'hidden',
                animation: `ag 7s ease-in-out ${-i * 2.1}s infinite`,
                transition: 'border-color .25s, box-shadow .25s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}55`; e.currentTarget.style.boxShadow = `0 4px 24px ${color}18`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bdr)'; e.currentTarget.style.boxShadow = ''; }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${color}, transparent)` }} />
                <div style={{ fontSize: '1.8rem', marginBottom: '12px' }}>{topic.icon}</div>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '.75rem', fontWeight: 700, color, marginBottom: '6px', letterSpacing: '.04em' }}>
                  {topic.title}
                </div>
                <div style={{ fontSize: '.72rem', color: 'var(--t3)', marginBottom: '12px', fontFamily: "'Space Mono', monospace" }}>
                  By {topic.speaker} · {topic.role}
                </div>
                <p style={{ fontSize: '.83rem', color: 'var(--t2)', lineHeight: 1.7 }}>{topic.summary}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Volunteers */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--bdr)',
          borderRadius: 'var(--r3)', padding: '28px', marginBottom: '40px',
        }}>
          <h2 style={{
            fontFamily: "'Orbitron', monospace", fontSize: '1rem', fontWeight: 700,
            color: 'var(--t1)', marginBottom: '18px',
            borderLeft: `3px solid var(--c1)`, paddingLeft: '14px',
          }}>🙌 Volunteers</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {ev.volunteers.map(v => (
              <span key={v} style={{
                padding: '6px 16px', borderRadius: '50px',
                background: 'var(--c1a)', color: 'var(--c1)',
                border: '1px solid var(--c1b)',
                fontSize: '.82rem', fontWeight: 600,
              }}>{v}</span>
            ))}
          </div>
        </div>

        {/* Hashtags */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '.6rem', color: 'var(--t3)', letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Trending
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {ev.hashtags.map(h => (
              <span key={h} style={{
                fontSize: '.75rem', padding: '4px 12px', borderRadius: '20px',
                background: `${color}12`, color, border: `1px solid ${color}25`,
                fontFamily: "'Space Mono', monospace",
              }}>{h}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
