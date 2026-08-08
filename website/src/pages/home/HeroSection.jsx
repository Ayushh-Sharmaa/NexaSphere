import { useEffect, useRef, useState, useCallback } from 'react';
import { apiClient } from '../../utils/apiClient';
import { useTranslation } from 'react-i18next';

import { BRAND_LOGO_ICON } from '../../shared/brandAssets';
import { IconArrowRight, IconSpark, DynamicIcon } from '../../shared/Icons';
import Image from '../../shared/next-image';

/* â”€â”€ Ripple Button â”€â”€ */
function RippleBtn({ cls, children, href, onClick }) {
  const ref = useRef(null);
  const timeoutsRef = useRef([]);

  useEffect(() => {
    const current = timeoutsRef.current;
    return () => {
      current.forEach(clearTimeout);
    };
  }, []);

  const go = (e) => {
    const b = ref.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    const el = document.createElement('span');
    el.className = 'rpl';
    el.style.left = e.clientX - r.left + 'px';
    el.style.top = e.clientY - r.top + 'px';
    b.appendChild(el);
    const t = setTimeout(() => el.remove(), 700);
    timeoutsRef.current.push(t);
    onClick && onClick(e);
  };
  useEffect(() => {
    return () => timeoutsRef.current.forEach(clearTimeout);
  }, []);
  if (href)
    return (
      <a
        ref={ref}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`btn btn-ripple ${cls}`}
        onClick={go}
      >
        {children}
      </a>
    );
  return (
    <button ref={ref} className={`btn btn-ripple ${cls}`} onClick={go}>
      {children}
    </button>
  );
}

/* â”€â”€ Animated gradient title â€” safe in both modes â”€â”€ */
function HeroTitle({ isLight }) {
  return (
    <div className="hero-title">
      <span className="hero-title-text">NexaSphere</span>
    </div>
  );
}

/* â”€â”€ SVG Orbit rings â”€â”€ */
function OrbitRings({ isLight }) {
  const rings = isLight
    ? [
        { rx: 105, ry: 48, dur: 8, r: 2, col: '204,17,17', d: '0s' },
        { rx: 58, ry: 182, dur: 13, r: 1.5, col: '136,0,0', d: '-5s' },
        { rx: 162, ry: 37, dur: 17, r: 1, col: '238,34,34', d: '-9s' },
        { rx: 78, ry: 158, dur: 6, r: 2, col: '255,68,68', d: '-2s' },
      ]
    : [
        { rx: 105, ry: 48, dur: 8, r: 2, col: '204,17,17', d: '0s' },
        { rx: 58, ry: 182, dur: 13, r: 1.5, col: '136,0,0', d: '-5s' },
        { rx: 162, ry: 37, dur: 17, r: 1, col: '238,34,34', d: '-9s' },
        { rx: 78, ry: 158, dur: 6, r: 2, col: '255,68,68', d: '-2s' },
      ];
  const tilts = [
    'rotate(-22 250 250)',
    'rotate(14 250 250)',
    'rotate(55 250 250)',
    'rotate(-35 250 250)',
  ];
  return (
    <svg
      width="280"
      height="280"
      viewBox="0 0 500 500"
      data-parallax="8"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%,-50%)',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'visible',
      }}
    >
      {rings.map((rg, i) => (
        <g key={`svg-ring-${i}`} transform={tilts[i]}>
          <ellipse
            cx="250"
            cy="250"
            rx={rg.rx}
            ry={rg.ry}
            fill="none"
            stroke={`rgba(${rg.col},.18)`}
            strokeWidth="1"
          />
          <circle
            r={rg.r * 3.5}
            fill={`rgba(${rg.col},.95)`}
            style={{
              filter: `drop-shadow(0 0 ${rg.r * 5}px rgba(${rg.col},.9))`,
            }}
          >
            <animateMotion dur={`${rg.dur}s`} repeatCount="indefinite" begin={rg.d}>
              <mpath href={`#hr${i}`} />
            </animateMotion>
          </circle>
          <path
            id={`hr${i}`}
            d={`M ${250 - rg.rx} 250 a ${rg.rx} ${rg.ry} 0 1 1 ${rg.rx * 2} 0 a ${rg.rx} ${rg.ry} 0 1 1 -${rg.rx * 2} 0`}
            fill="none"
          />
        </g>
      ))}
    </svg>
  );
}

/* â”€â”€ Logo with 3D mouse tilt â”€â”€ */
function Logo3D({ ready, isLight }) {
  const ref = useRef(null);
  const onMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) / 220;
    const dy = (e.clientY - (rect.top + rect.height / 2)) / 220;
    el.style.transform = `perspective(700px) rotateX(${-dy * 16}deg) rotateY(${dx * 16}deg) scale(1.05)`;
  }, []);
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = '';
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="hero-logo-wrap"
      style={{
        transformStyle: 'preserve-3d',
        transition: 'transform .14s ease',
        opacity: 1,
        transform: ready ? 'scale(1)' : 'scale(.3) rotateY(180deg)',
        transitionProperty: 'opacity,transform',
        transitionDuration: '1s',
        transitionTimingFunction: 'cubic-bezier(.34,1.56,.64,1)',
      }}
    >
      <OrbitRings isLight={isLight} />
      <Image
        src={BRAND_LOGO_ICON}
        alt="NexaSphere"
        className="hero-logo-img"
        priority={true}
        width={220}
        height={220}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-8px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90px',
          height: '14px',
          borderRadius: '50%',
          background: `radial-gradient(ellipse,${isLight ? 'rgba(204,17,17,.22)' : 'rgba(204,17,17,.32)'},transparent 70%)`,
          filter: 'blur(5px)',
          animation: 'float 5s ease-in-out infinite',
        }}
      />
    </div>
  );
}

/* â”€â”€ Stats bar â”€â”€ */
function StatsBar({ vis, isLight }) {
  const { t } = useTranslation();
  const items = [
    { v: '12', l: t('hero.stats.members', 'Members'), i: 'Users' },
    { v: '8', l: t('hero.stats.activities', 'Activities'), i: 'Activity' },
    { v: '1', l: t('hero.stats.events_done', 'Events Done'), i: 'Calendar' },
    { v: '∞', l: t('hero.stats.ideas', 'Ideas'), i: 'Lightbulb' },
  ];
  return (
    <div
      style={{
        display: 'flex',
        maxWidth: '500px',
        margin: '56px auto 0',
        background: isLight ? 'rgba(26,26,26,.04)' : 'rgba(204,17,17,.04)',
        border: `1px solid ${isLight ? 'rgba(26,26,26,.09)' : 'rgba(204,17,17,.12)'}`,
        borderRadius: '14px',
        overflow: 'hidden',
        opacity: vis ? 1 : 0,
        transform: vis ? 'none' : 'translateY(22px)',
        transition: 'all .85s cubic-bezier(.22,1,.36,1)',
        transitionDelay: '.4s',
      }}
    >
      {items.map((s, i) => (
        <div
          key={`stat-item-${i}`}
          style={{
            flex: 1,
            padding: '13px 6px',
            textAlign: 'center',
            cursor: 'default',
            borderRight:
              i < 3
                ? `1px solid ${isLight ? 'rgba(26,26,26,.07)' : 'rgba(204,17,17,.10)'}`
                : 'none',
            transition: 'background .2s',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = isLight
              ? 'rgba(26,26,26,.06)'
              : 'rgba(204,17,17,.09)')
          }
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <div
            style={{
              fontSize: '.9rem',
              marginBottom: '2px',
              color: 'var(--c1)',
            }}
          >
            <DynamicIcon name={s.i} size={18} />
          </div>
          <div
            style={{
              fontFamily: 'Orbitron,monospace',
              fontSize: 'clamp(1.1rem,3vw,1.75rem)',
              fontWeight: 900,
              backgroundImage: isLight
                ? 'linear-gradient(135deg,#CC1111,#880000)'
                : 'linear-gradient(135deg,#EE2222,#CC1111)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: vis ? `countUp .5s ${0.4 + i * 0.1}s both` : 'none',
            }}
          >
            {s.v}
          </div>
          <div
            style={{
              fontSize: '.58rem',
              color: isLight ? '#6B6B6B' : 'var(--t2)',
              textTransform: 'uppercase',
              letterSpacing: '.1em',
              marginTop: '1px',
              fontFamily: "'Space Mono',monospace",
            }}
          >
            {s.l}
          </div>
        </div>
      ))}
    </div>
  );
}

function Atmosphere({ isLight }) {
  return (
    <>
      {/* Binary data streams — visible in both themes */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        {Array.from({ length: 9 }, (_, i) => (
          <div
            key={`circle-${i}`}
            style={{
              position: 'absolute',
              left: `${8 + i * 10}%`,
              top: 0,
              fontFamily: "'Space Mono',monospace",
              fontSize: '8px',
              color: isLight ? 'rgba(180,20,20,0.45)' : 'var(--c1)',
              lineHeight: 1.9,
              userSelect: 'none',
              animation: `dataStream ${4.2 + i * 0.65}s linear infinite`,
              animationDelay: `${-i * 1.3}s`,
              opacity: isLight ? 0.5 : 0.06,
            }}
          >
            {Array.from({ length: 28 }, () => (Math.random() > 0.5 ? '1' : '0')).join('\n')}
          </div>
        ))}
      </div>

      {/* Scanline */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '1px',
            background: isLight
              ? 'linear-gradient(90deg,transparent,rgba(204,17,17,.25),rgba(136,0,0,.25),transparent)'
              : 'linear-gradient(90deg,transparent,rgba(204,17,17,.38),rgba(136,0,0,.38),transparent)',
            animation: 'scanline 8s linear infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: isLight
              ? 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(204,17,17,.003) 2px,rgba(204,17,17,.003) 4px)'
              : 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(204,17,17,.005) 2px,rgba(204,17,17,.005) 4px)',
          }}
        />
      </div>
    </>
  );
}

export default function HeroSection({ onTabChange, onApply, onJoin, theme = 'dark' }) {
  const { t } = useTranslation();
  const [ready, setReady] = useState(false);
  const [statsVis, setStatsVis] = useState(false);
  const [activeBanner, setActiveBanner] = useState(null);
  const isLight = theme === 'light';

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await apiClient('/api/content/banners');
        if (res.banners && res.banners.length > 0) {
          // simple rotation logic: pick random or first. Here we pick the first scheduled active banner
          setActiveBanner(res.banners[0]);
        }
      } catch (e) {
        console.error('Failed to fetch banners', e);
      }
    };
    fetchBanners();

    const t1 = setTimeout(() => setReady(true), 80);
    const t2 = setTimeout(() => setStatsVis(true), 900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <section className="hero-section" id="section-home" style={{ position: 'relative', zIndex: 2 }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background: isLight ? 'transparent' : '#0A0A0A',
          transition: 'background 1.2s cubic-bezier(.4,0,.2,1)',
        }}
      />
      {/* Logo glow — subtle radial red only around center */}
      <div
        className="hero-glow"
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-58%)',
          pointerEvents: 'none',
          zIndex: 0,
          filter: 'blur(32px)',
          animation: 'cinGlow 4s ease-in-out infinite',
        }}
        // inline background kept here so it adapts to theme
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: isLight
              ? 'radial-gradient(circle, rgba(230,57,70,0.10) 0%, transparent 65%)'
              : 'radial-gradient(circle, rgba(230,57,70,0.18) 0%, transparent 65%)',
          }}
        />
      </div>
      <Atmosphere isLight={isLight} />

      <div
        className="hero-content"
        style={{ position: 'relative', zIndex: 2, paddingBottom: '80px' }}
      >
        {activeBanner ? (
          <div
            className="mb-8 w-full max-w-4xl mx-auto cursor-pointer"
            onClick={() =>
              activeBanner.linkUrl
                ? window.open(activeBanner.linkUrl, '_blank', 'noopener,noreferrer')
                : null
            }
          >
            <img
              src={activeBanner.imageUrl}
              alt={activeBanner.title}
              style={{
                width: '100%',
                borderRadius: '16px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                objectFit: 'cover',
                maxHeight: '400px',
              }}
            />
          </div>
        ) : (
          <Logo3D ready={ready} isLight={isLight} />
        )}

        <HeroTitle isLight={isLight} />

        <p
          className="hero-tagline"
          style={{
            animationName: 'letterDrop',
            animationDuration: '.75s',
            animationDelay: '.5s',
            animationFillMode: 'forwards',
            animationTimingFunction: 'cubic-bezier(.22,1,.36,1)',
            opacity: 1,
          }}
        >
          {t('hero.tagline', "GL Bajaj's Student-Driven Tech Ecosystem")}
          <span
            style={{
              animation: 'blink 1s step-end infinite',
              color: 'var(--c1)',
              marginLeft: '2px',
            }}
          >
            _
          </span>
        </p>

        <div
          className="hero-buttons"
          style={{
            animationName: 'letterDrop',
            animationDuration: '.75s',
            animationDelay: '.75s',
            animationFillMode: 'forwards',
            animationTimingFunction: 'cubic-bezier(.22,1,.36,1)',
            opacity: 1,
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <RippleBtn
              cls="btn-primary"
              onClick={() => (onJoin ? onJoin() : onTabChange('Core Team'))}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {t('hero.join_as_member', 'Join as Member')} <IconArrowRight />
              </span>
            </RippleBtn>
            <RippleBtn cls="btn-outline" onClick={() => onTabChange('Core Team')}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {t('hero.core_team', 'Core Team')} <IconArrowRight />
              </span>
            </RippleBtn>
          </div>

          <div
            style={{
              marginTop: '16px',
              padding: '14px 24px',
              background: isLight ? 'rgba(204,17,17,.05)' : 'rgba(204,17,17,.07)',
              border: `1px solid ${isLight ? 'rgba(204,17,17,.18)' : 'rgba(204,17,17,.18)'}`,
              borderRadius: '16px',
              maxWidth: '420px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: '.82rem',
                color: 'var(--t2)',
                marginBottom: '10px',
                lineHeight: 1.5,
              }}
            >
              {t('hero.want_to_be_part', 'Want to be part of the NexaSphere Core Team?')}
            </p>
            <RippleBtn
              cls="btn-join"
              onClick={() => (onApply ? onApply() : onTabChange('Core Team'))}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {t('hero.apply_for_core_team', 'Apply for Core Team')} <IconSpark />
              </span>
            </RippleBtn>
          </div>
        </div>

        <StatsBar vis={statsVis} isLight={isLight} />
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '150px',
          background: 'linear-gradient(to bottom,transparent,var(--bg))',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          opacity: 0.42,
          animation: 'float 2.5s ease-in-out infinite',
        }}
      >
        <div
          style={{
            fontSize: '.56rem',
            color: isLight ? '#78716c' : 'var(--t2)',
            letterSpacing: '.22em',
            fontFamily: "'Space Mono',monospace",
          }}
        >
          {t('hero.scroll', 'SCROLL')}
        </div>
        <div
          className="scroll-indicator-line"
          style={{
            width: '1px',
            height: '28px',
            background: `linear-gradient(to bottom,var(--c1),transparent)`,
          }}
        />
      </div>
    </section>
  );
}
