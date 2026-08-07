import { useEffect, useRef, useState, useMemo } from 'react';
import { activities, difficultyLevels } from '../../data/activities';
import { BannerOrbs } from '../../shared/MotionLayer';
import Footer from '../../shared/Footer';
import { DynamicIcon } from '../../shared/Icons';

const activityDetails = {
  Hackathon: {
    color: '#CC1111',
    longDesc:
      'Intense 24–48 hour coding marathons where teams build innovative solutions to real-world problems under time pressure. Participants form cross-functional teams, brainstorm ideas, design architectures, and ship working prototypes — all under the clock.',
    highlights: [
      'Team-based challenges',
      'Mentorship from seniors',
      'Real problem statements',
      'Prizes & recognition',
    ],
    skills: ['Full-Stack Dev', 'Problem Solving', 'Team Collaboration', 'System Design'],
  },
  Codathon: {
    color: '#EE2222',
    longDesc:
      'Competitive programming contests that test your algorithmic thinking, data structures knowledge, and code efficiency. From greedy to dynamic programming — sharpen your edge for placements and ICPC-style rounds.',
    highlights: [
      'Timed challenge rounds',
      'Multi-difficulty problems',
      'Leaderboard ranking',
      'Individual & team modes',
    ],
    skills: ['Algorithms', 'DSA', 'Competitive Programming', 'Optimization'],
  },
  Ideathon: {
    color: '#FF4444',
    longDesc:
      'Creativity-first competition where the best idea wins — no code required. Pitch your innovation, back it with research, and present a compelling case. Perfect for thinkers, designers, and business-minded builders.',
    highlights: [
      'Pitching rounds',
      'Expert panel judging',
      'Market research focus',
      'Cross-discipline teams',
    ],
    skills: ['Creative Thinking', 'Presentation', 'Research', 'Product Design'],
  },
  Promptathon: {
    color: '#FF6666',
    longDesc:
      'The art of talking to AI turned into a competitive sport. Craft the sharpest, most creative prompts to solve real-world problems, generate stunning outputs, and outsmart your peers in the age of generative intelligence.',
    highlights: [
      'Multi-round prompt battles',
      'Judged on creativity & accuracy',
      'Real-world AI tasks',
      'Leaderboard & prizes',
    ],
    skills: ['Prompt Engineering', 'AI Tools', 'Creative Thinking', 'Problem Solving'],
  },
  Workshop: {
    color: '#AA0000',
    longDesc:
      'Hands-on learning sessions on cutting-edge tools, frameworks, and emerging technologies. Led by experienced peers, alumni, or industry guests — every workshop gets you building something real by the end.',
    highlights: [
      'Live coding sessions',
      'Take-home projects',
      'Q&A with experts',
      'Beginner to advanced tracks',
    ],
    skills: ['New Technologies', 'Practical Skills', 'Tool Mastery', 'Applied Learning'],
  },
  'Insight Session': {
    color: '#CC3333',
    longDesc:
      'Deep-dive talks and peer-to-peer knowledge sharing where every member is both teacher and student. Explore industry trends, career paths, emerging research, and the big ideas shaping tomorrow’s technology landscape.',
    highlights: [
      'Peer presentations',
      'Industry trend analysis',
      'Career guidance',
      'Open discussions',
    ],
    skills: ['Communication', 'Research', 'Critical Thinking', 'Domain Knowledge'],
  },
  'Open Source Day': {
    color: '#4CAF50',
    longDesc:
      'Dedicated events encouraging real contributions to open-source projects. Learn Git workflows, find your first issue, submit PRs, and become part of the global developer community — all in a guided, supportive environment.',
    highlights: [
      'First-PR guidance',
      'Project selection help',
      'Git & GitHub deep dive',
      'Community recognition',
    ],
    skills: ['Git', 'Open Source', 'Code Review', 'Documentation'],
  },
  'Tech Debate': {
    color: '#880000',
    longDesc:
      'Structured debates on the most controversial topics in tech — AI vs Human Jobs, Native vs Cross-Platform, SQL vs NoSQL. Sharpen your ability to defend a position, handle rebuttals, and communicate technical ideas clearly.',
    highlights: ['Structured format', 'Expert moderation', 'Both sides argued', 'Audience Q&A'],
    skills: ['Public Speaking', 'Critical Thinking', 'Technical Communication', 'Argumentation'],
  },
};

const difficultyColors = {
  beginner: '#4CAF50',
  intermediate: '#FF9800',
  advanced: '#F44336',
};

const difficultyBadgeStyles = Object.fromEntries(
  Object.entries(difficultyColors).map(([level, color]) => [
    level,
    { background: `${color}18`, color, border: `1px solid ${color}35` },
  ])
);

function difficultyLabel(level) {
  return difficultyLevels.find((d) => d.value === level)?.label || level;
}

function ActivityCard({ a, idx, onNavigate }) {
  const ref = useRef(null);
  const details = activityDetails[a.title] || {};
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const onMove = (e) => {
    const c = ref.current;
    if (!c || prefersReducedMotion) return;
    const rect = c.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    c.style.transform = `translateY(-10px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg) scale(1.02)`;
  };
  const onLeave = () => {
    if (ref.current && !prefersReducedMotion) ref.current.style.transform = '';
  };
  const click = () => {
    const c = ref.current;
    if (c && !prefersReducedMotion) {
      c.style.transform = 'scale(.93)';
      setTimeout(() => {
        c.style.transform = '';
      }, 140);
    }
    setTimeout(() => onNavigate('activity', a.title), prefersReducedMotion ? 0 : 160);
  };

  return (
    <div
      ref={ref}
      onClick={click}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`ns-reveal ns-act-card ns-d${(idx % 6) + 1}`}
      style={{
        background: 'var(--card)',
        border: `1px solid var(--bdr)`,
        borderRadius: 'var(--r3)',
        padding: '28px 24px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        perspective: '800px',
        animation: `ag 7s ease-in-out ${[-0, -2.1, -4.2, -1.0, -3.3, -5.5, -0.7][idx % 7]}s infinite`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: a.color || 'var(--c1)',
          borderRadius: 'var(--r3) var(--r3) 0 0',
        }}
      />

      <div
        className="ns-act-icon"
        style={{
          fontSize: '2.4rem',
          marginBottom: '14px',
          display: 'inline-block',
          color: a.color || 'var(--c1)',
        }}
      >
        <DynamicIcon name={a.icon} size={34} />
      </div>
      <div
        style={{
          fontFamily: "'Orbitron', monospace",
          fontSize: '.8rem',
          fontWeight: 700,
          color: a.color || 'var(--c1)',
          marginBottom: '10px',
          letterSpacing: '.06em',
          textTransform: 'uppercase',
        }}
      >
        {a.title}
      </div>
      {a.difficultyLevel && (
        <span
          className={`ns-difficulty-badge ns-difficulty-${a.difficultyLevel}`}
          style={{
            display: 'inline-block',
            fontSize: '.62rem',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '20px',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '.05em',
            fontFamily: "'Space Mono', monospace",
            ...difficultyBadgeStyles[a.difficultyLevel],
          }}
        >
          {difficultyLabel(a.difficultyLevel)}
        </span>
      )}
      <p
        style={{
          fontSize: '.88rem',
          color: 'var(--t2)',
          lineHeight: 1.72,
          marginBottom: '18px',
        }}
      >
        {details.longDesc || a.description}
      </p>

      {details.skills && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginBottom: '18px',
          }}
        >
          {details.skills.map((s) => (
            <span
              key={s}
              style={{
                fontSize: '.62rem',
                padding: '3px 9px',
                borderRadius: '20px',
                background: a.color ? `${a.color}18` : `var(--c1-18)`,
                color: a.color || 'var(--c1)',
                border: `1px solid ${a.color ? a.color + '35' : 'var(--c1-35)'}`,
                fontFamily: "'Space Mono', monospace",
                fontWeight: 600,
                transition: 'transform .2s, background .2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                if (a.color) e.target.style.background = `${a.color}30`;
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = '';
                if (a.color) e.target.style.background = `${a.color}18`;
              }}
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {details.highlights && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 18px' }}>
          {details.highlights.map((h) => (
            <li
              key={h}
              style={{
                fontSize: '.8rem',
                color: 'var(--t2)',
                padding: '4px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ color: a.color || 'var(--c1)', fontWeight: 700 }}>→</span> {h}
            </li>
          ))}
        </ul>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '.72rem',
          fontWeight: 700,
          color: a.color || 'var(--c1)',
          textTransform: 'uppercase',
          letterSpacing: '.1em',
          opacity: 0.7,
          transition: 'opacity .2s, letter-spacing .2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.letterSpacing = '.16em';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '.7';
          e.currentTarget.style.letterSpacing = '.1em';
        }}
      >
        <span>View Sessions</span>
        <span>→</span>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '16px',
          height: '16px',
          borderTop: `1.5px solid ${a.color || 'var(--c1)'}`,
          borderLeft: `1.5px solid ${a.color || 'var(--c1)'}`,
          opacity: 0.5,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '16px',
          height: '16px',
          borderBottom: `1.5px solid ${a.color || 'var(--c1)'}`,
          borderRight: `1.5px solid ${a.color || 'var(--c1)'}`,
          opacity: 0.5,
        }}
      />
    </div>
  );
}

export default function ActivitiesPage({ onNavigate, onBack }) {
  const [selectedDifficulties, setSelectedDifficulties] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('difficulty');
    return raw ? raw.split(',').filter(Boolean) : [];
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (selectedDifficulties.length > 0) {
      params.set('difficulty', selectedDifficulties.join(','));
    } else {
      params.delete('difficulty');
    }
    const query = params.toString();
    const newUrl = window.location.pathname + (query ? `?${query}` : '') + window.location.hash;
    window.history.replaceState({}, '', newUrl);
  }, [selectedDifficulties]);

  const toggleDifficulty = (value) => {
    setSelectedDifficulties((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const filteredActivities = useMemo(() => {
    if (selectedDifficulties.length === 0) return activities;
    return activities.filter((a) => selectedDifficulties.includes(a.difficultyLevel));
  }, [selectedDifficulties]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      document
        .querySelectorAll('#activities-page .pop-in, #activities-page .pop-word')
        .forEach((el) => {
          el.classList.add('fired');
        });

      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            // If motion is reduced, skip animation but still mark as fired
            if (prefersReducedMotion) {
              e.target.classList.add('no-animation');
            } else {
              e.target.classList.add('fired');
            }
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0, rootMargin: '0px 0px -10px 0px' }
    );
    // Filter out elements that already have the 'fired' class — on re-mount
    // (user navigates away and back) querySelectorAll finds all elements again
    // including ones that already animated in the previous mount. Re-observing
    // them wastes observer slots and may re-trigger animations.
    document
      .querySelectorAll('#activities-page .pop-in, #activities-page .pop-word')
      .forEach((el) => {
        if (!el.classList.contains('fired') && !el.classList.contains('no-animation')) {
          obs.observe(el);
        }
      });
    return () => obs.disconnect();
  }, []);

  return (
    <div id="activities-page" style={{ minHeight: '100vh', padding: '60px 0 100px' }}>
      <div
        className="page-banner"
        style={{
          background: 'linear-gradient(135deg, rgba(204,17,17,.07), rgba(136,0,0,.04))',
          borderBottom: '1px solid var(--bdr)',
          padding: '60px 0 50px',
          textAlign: 'center',
          /* Normalized to 32px — matches EventsPage and ActivityDetailPage standard */
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          className="page-banner-line"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg,var(--c1),var(--c2),var(--c3))',
          }}
        />
        <BannerOrbs color="rgba(204,17,17,.06)" />
        <button
          onClick={onBack}
          className="ns-back-btn"
          style={{
            position: 'absolute',
            top: '24px',
            left: '28px',
            background: 'var(--card)',
            border: '1px solid var(--bdr)',
            borderRadius: '50px',
            padding: '7px 16px',
            color: 'var(--t2)',
            fontSize: '.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 600,
          }}
        >
          ← Back
        </button>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <span className="cin-section-label pop-in">NexaSphere · GL Bajaj</span>
          <h1 className="section-title pop-word" style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)' }}>
            Our Activities
          </h1>
          <p
            className="section-subtitle pop-in"
            style={{
              animationDelay: '.1s',
              maxWidth: '580px',
              margin: '0 auto',
            }}
          >
            Every format is designed to sharpen a different skill. Explore what excites you — then
            dive in.
          </p>
        </div>
      </div>

      <div className="container">
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '28px',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '.78rem',
              color: 'var(--t2)',
              fontWeight: 600,
              marginRight: '4px',
            }}
          >
            Filter by difficulty:
          </span>
          {difficultyLevels.map((d) => {
            const active = selectedDifficulties.includes(d.value);
            const color = difficultyColors[d.value] || 'var(--c1)';
            return (
              <button
                key={d.value}
                onClick={() => toggleDifficulty(d.value)}
                aria-pressed={active}
                style={{
                  padding: '7px 16px',
                  borderRadius: '50px',
                  fontSize: '.8rem',
                  fontWeight: 600,
                  border: `1px solid ${active ? color : 'var(--bdr)'}`,
                  background: active ? `${color}20` : 'var(--card)',
                  color: active ? color : 'var(--t2)',
                  cursor: 'pointer',
                  transition: 'all .15s',
                  fontFamily: "'Rajdhani', sans-serif",
                }}
              >
                {d.label}
              </button>
            );
          })}
          {selectedDifficulties.length > 0 && (
            <button
              onClick={() => setSelectedDifficulties([])}
              style={{
                padding: '7px 14px',
                borderRadius: '50px',
                fontSize: '.78rem',
                border: '1px solid var(--bdr)',
                background: 'transparent',
                color: 'var(--t2)',
                cursor: 'pointer',
                fontFamily: "'Rajdhani', sans-serif",
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {filteredActivities.length === 0 && (
          <p
            style={{
              textAlign: 'center',
              color: 'var(--t2)',
              padding: '40px 0',
              fontSize: '.95rem',
            }}
          >
            No activities match the selected difficulty filters.
          </p>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px',
          }}
        >
          {filteredActivities.map((a, i) => (
            <ActivityCard key={a.id} a={a} idx={i} onNavigate={onNavigate} />
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
