import { useState, useEffect, useRef } from 'react';
import apiClient from '../../utils/apiClient.js';
import { on, off } from '../../utils/socketClient.js';
import TeamMemberModal from './TeamMemberModal';
import { IconSpark } from '../../shared/Icons';
import { teamMembers as fallbackTeamMembers } from '../../data/teamData';
import { getApiBase } from '../../utils/runtimeConfig';
import {
  getLocalTeamMembers,
  mergeTeamMembers,
  subscribePublicContent,
} from '../../utils/publicContentStore.js';

function MemberCard({ member, idx, onClick }) {
  const ref = useRef(null);
  const [imgError, setImgError] = useState(false);
  const agDelay = [-0.0, -2.1, -4.2, -1.0, -3.3, -5.5, -0.7, -6.1, -2.8, -4.9, -1.6, -3.8];

  const onMove = (e) => {
    const c = ref.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    c.style.animationPlayState = 'paused';
    c.style.transform = `translateY(-14px) rotateX(${-y * 18}deg) rotateY(${x * 18}deg) scale(1.06)`;
  };
  const onLeave = () => {
    const c = ref.current;
    if (!c) return;
    c.style.transform = '';
    c.style.animationPlayState = '';
  };
  const clickTimerRef = useRef(null);
  const animTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, []);

  const click = () => {
    const c = ref.current;
    if (c) {
      c.style.transform = 'scale(.9)';
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
      animTimerRef.current = setTimeout(() => {
        if (c) c.style.transform = '';
        animTimerRef.current = null;
      }, 140);
    }
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      onClick(member);
      clickTimerRef.current = null;
    }, 110);
  };

  return (
    <div
      ref={ref}
      className="team-card shimmer mag-card"
      style={{
        cursor: 'pointer',
        perspective: '800px',
        animation: `ag 7s ease-in-out ${agDelay[idx % 12]}s infinite`,
        willChange: 'transform',
        animationFillMode: 'both',
        opacity: 1,
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={click}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') click();
      }}
    >
      <div className="team-card-photo-wrap">
        <img
          loading="lazy"
          src={
            !member.photo || imgError
              ? 'https://api.dicebear.com/7.x/initials/svg?seed=' +
                encodeURIComponent(member.name) +
                '&backgroundColor=7b6fff&textColor=ffffff'
              : member.photo
          }
          alt={member.name}
          className="team-card-photo"
          onError={() => setImgError(true)}
        />
      </div>
      <div className="team-card-name">{member.name}</div>
      <div className="team-card-role">{member.role}</div>
      <div className="team-card-chips">
        <span className="chip-branch">{member.branch}</span>
        <span className="chip-section">§{member.section}</span>
      </div>
      <div className="team-card-hint">Click to view ↗</div>
      <div className="corner-tl" />
      <div className="corner-br" />
    </div>
  );
}

export default function TeamSection({ onApply }) {
  const [sel, setSel] = useState(null);
  const [members, setMembers] = useState(() => getLocalTeamMembers(fallbackTeamMembers));

  useEffect(() => {
    let alive = true;
    const base = getApiBase();
    const applyLocalTeam = () => {
      if (alive) setMembers(getLocalTeamMembers(fallbackTeamMembers));
    };

    if (!base) {
      applyLocalTeam();
      return subscribePublicContent(applyLocalTeam);
    }

    const url = `${base}/api/content/team`;

    const fetchTeam = () => {
      apiClient(url)
        .then((data) => {
          if (!alive) return;
          if (Array.isArray(data?.members)) {
            setMembers(
              data.members.length
                ? mergeTeamMembers(fallbackTeamMembers, data.members)
                : getLocalTeamMembers(fallbackTeamMembers)
            );
          } else {
            setMembers(getLocalTeamMembers(fallbackTeamMembers));
          }
        })
        .catch(() => {
          setMembers((prev) => (prev?.length ? prev : getLocalTeamMembers(fallbackTeamMembers)));
        });
    };

    fetchTeam();

    // Replace unconditional 4s polling with a visibilitychange listener —
    // refetch only when the user returns to the tab instead of hammering
    // the API every 4 seconds regardless of tab visibility or user activity.
    // The socket listener below already handles real-time admin updates.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchTeam();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Socket: refetch immediately when admin updates team
    const onContentUpdated = (data) => {
      if (data?.type === 'team') {
        fetchTeam();
      }
    };
    on('content:updated', onContentUpdated);

    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      off('content:updated', onContentUpdated);
    };
  }, []);

  useEffect(() => {
    // Tracks animationend listeners added dynamically below so they can be
    // explicitly removed on unmount — { once: true } only cleans up after
    // the event actually fires, but if the component unmounts mid-animation
    // the listener is still attached and would mutate a detached DOM node's
    // style when it eventually fires.
    const pendingListeners = [];
    const addRevealListener = (target) => {
      const handler = () => {
        target.style.opacity = '1';
        target.style.transform = 'none';
      };
      target.addEventListener('animationend', handler, { once: true });
      pendingListeners.push({ target, handler });
    };
    const elements = document.querySelectorAll(
      '#section-team .pop-flip, #section-team .pop-in, #section-team .pop-word'
    );
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !e.target.classList.contains('fired')) {
            e.target.classList.add('fired');
            addRevealListener(e.target);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0, rootMargin: '0px 0px -10px 0px' }
    );
    elements.forEach((el) => obs.observe(el));
    const fallback = setTimeout(() => {
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight + 100 && !el.classList.contains('fired')) {
          el.classList.add('fired');
          addRevealListener(el);
        }
      });
    }, 120);
    return () => {
      obs.disconnect();
      clearTimeout(fallback);
      pendingListeners.forEach(({ target, handler }) => {
        target.removeEventListener('animationend', handler);
      });
    };
  }, []);

  return (
    <section className="section" id="section-team">
      <div className="container">
        <div className="section-heading">
          <span className="cin-section-label pop-in">GL Bajaj Group of Institutions · Mathura</span>
          <h2 className="section-title pop-word">Core Team</h2>
          <p className="section-subtitle pop-in" style={{ animationDelay: '.1s' }}>
            The Minds Behind NexaSphere
          </p>
        </div>

        <div className="team-grid cin-container">
          {members.map((m, i) => (
            <MemberCard key={m.id} member={m} idx={i} onClick={setSel} />
          ))}
        </div>

        <div
          className="ns-reveal-scale"
          style={{
            textAlign: 'center',
            marginTop: '56px',
            padding: '28px',
            background: 'var(--card)',
            border: '1px solid var(--bdr)',
            borderRadius: 'var(--r3)',
            maxWidth: '520px',
            margin: '56px auto 0',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div className="corner-tl" />
          <div className="corner-br" />
          <h3
            style={{
              fontFamily: 'Orbitron,monospace',
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--c1)',
              marginBottom: '8px',
              letterSpacing: '.05em',
            }}
          >
            Want to Join NexaSphere?
          </h3>
          <p
            style={{
              color: 'var(--t2)',
              fontSize: '.88rem',
              marginBottom: '18px',
              lineHeight: 1.65,
            }}
          >
            We&apos;re looking for passionate students to drive NexaSphere forward. Fill in the form
            and we&apos;ll reach out!
          </p>
          <button
            type="button"
            onClick={() => onApply && onApply()}
            className="btn btn-join btn-ripple"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            Apply Here <IconSpark />
          </button>
        </div>
      </div>

      {sel && <TeamMemberModal member={sel} onClose={() => setSel(null)} />}
    </section>
  );
}
