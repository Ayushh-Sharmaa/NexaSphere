import { useEffect, useRef, useState, useCallback } from 'react';
import nexasphereLogo from '../assets/images/logos/nexasphere-logo.png';
import heroBg from '../assets/hero-bg.jpg';

const WHATSAPP_URL = 'https://chat.whatsapp.com/Jjc5cuUKENu0RC1vWSEs20';
const TITLE = 'NexaSphere';

/* ── Ripple Button ── */
function RippleButton({ className, children, onClick, href }) {
  const ref = useRef(null);
  const handleClick = e => {
    const btn = ref.current; if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const el = document.createElement('span');
    el.className = 'ripple-effect';
    el.style.left = (e.clientX - rect.left) + 'px';
    el.style.top  = (e.clientY - rect.top)  + 'px';
    btn.appendChild(el);
    setTimeout(() => el.remove(), 700);
    onClick && onClick(e);
  };
  if (href) return (
    <a ref={ref} href={href} target="_blank" rel="noopener noreferrer"
      className={`btn btn-ripple ${className}`} onClick={handleClick}>{children}</a>
  );
  return (
    <button ref={ref} className={`btn btn-ripple ${className}`} onClick={handleClick}>{children}</button>
  );
}

/* ── Glitch Title ── */
function GlitchTitle({ text }) {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 200);
    }, 5000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <style>{`
        @keyframes gl1 {
          0%,100% { clip-path:inset(0 0 95% 0); transform:translateX(-4px) skewX(-2deg); }
          25%      { clip-path:inset(30% 0 60% 0); transform:translateX(4px); }
          50%      { clip-path:inset(60% 0 25% 0); transform:translateX(-3px) skewX(3deg); }
          75%      { clip-path:inset(80% 0 5% 0); transform:translateX(2px); }
        }
        @keyframes gl2 {
          0%,100% { clip-path:inset(70% 0 0% 0); transform:translateX(4px) skewX(2deg); }
          33%      { clip-path:inset(20% 0 70% 0); transform:translateX(-4px); }
          66%      { clip-path:inset(50% 0 40% 0); transform:translateX(2px) skewX(-2deg); }
        }
      `}</style>
      {/* Base text */}
      {text.split('').map((ch, i) => (
        <span key={i} style={{
          display: 'inline-block',
          background: 'linear-gradient(270deg,#00e5ff,#7c6eff,#bf5fff,#ff2d78,#00e5ff)',
          backgroundSize: '300% 300%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animationName: 'letterDrop, gradientShift',
          animationDuration: '0.6s, 4s',
          animationTimingFunction: 'cubic-bezier(0.22,1,0.36,1), ease',
          animationFillMode: 'both, none',
          animationDelay: `${0.04 * i}s, ${i * 0.1}s`,
          animationIterationCount: '1, infinite',
        }}>{ch}</span>
      ))}
      {/* Glitch layer 1 */}
      {glitching && (
        <span aria-hidden="true" style={{
          position: 'absolute', top: 0, left: 0, width: '100%',
          background: 'linear-gradient(270deg,#00e5ff,#7c6eff,#bf5fff,#ff2d78,#00e5ff)',
          backgroundSize: '300% 300%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'gl1 0.2s steps(2) infinite',
          opacity: 0.9,
          filter: 'hue-rotate(180deg)',
        }}>{text}</span>
      )}
      {/* Glitch layer 2 */}
      {glitching && (
        <span aria-hidden="true" style={{
          position: 'absolute', top: 0, left: 0, width: '100%',
          background: 'linear-gradient(270deg,#ff2d78,#00e5ff,#7c6eff,#bf5fff)',
          backgroundSize: '300% 300%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'gl2 0.2s steps(2) infinite',
          opacity: 0.8,
          filter: 'hue-rotate(-90deg)',
        }}>{text}</span>
      )}
    </span>
  );
}

/* ── Orbit Ring ── */
function OrbitRing({ radius, duration, size, colorR, colorG, colorB, delayS, reverse }) {
  return (
    <div style={{
      position: 'absolute', top: '50%', left: '50%',
      width: radius * 2, height: radius * 2,
      marginTop: -radius, marginLeft: -radius,
      borderRadius: '50%',
      border: `1px solid rgba(${colorR},${colorG},${colorB},0.15)`,
    }}>
      <div style={{
        position: 'absolute', top: '50%', left: 0,
        width: size, height: size, borderRadius: '50%',
        background: `rgba(${colorR},${colorG},${colorB},1)`,
        boxShadow: `0 0 ${size * 4}px rgba(${colorR},${colorG},${colorB},0.9)`,
        marginTop: -size / 2, marginLeft: -size / 2,
        animation: `${reverse ? 'orbit2' : 'orbit'} ${duration}s linear infinite`,
        animationDelay: delayS,
      }} />
    </div>
  );
}

/* ── 3D Floating Logo ── */
function Logo3D({ mounted }) {
  const ref = useRef(null);
  const handleMove = useCallback(e => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / 200;
    const dy = (e.clientY - cy) / 200;
    el.style.transform = `perspective(600px) rotateX(${-dy * 15}deg) rotateY(${dx * 15}deg) scale(1.05)`;
  }, []);
  const handleLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = '';
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        position: 'relative', display: 'inline-block',
        marginBottom: '36px', transformStyle: 'preserve-3d',
        transition: 'transform 0.15s ease',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'scale(1)' : 'scale(0.3) rotateY(180deg)',
        transitionProperty: 'opacity, transform',
        transitionDuration: '1.2s',
        transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      {/* Orbit rings */}
      <OrbitRing radius={100} duration={8}  size={7} colorR={0}   colorG={229} colorB={255} delayS="0s"   />
      <OrbitRing radius={135} duration={13} size={5} colorR={124} colorG={110} colorB={255} delayS="-5s"  reverse />
      <OrbitRing radius={70}  duration={6}  size={6} colorR={191} colorG={95}  colorB={255} delayS="-2s"  />
      <OrbitRing radius={165} duration={18} size={4} colorR={255} colorG={45}  colorB={120} delayS="-9s"  reverse />

      {/* Logo */}
      <img
        src={nexasphereLogo}
        alt="NexaSphere"
        className="hero-logo"
        style={{
          position: 'relative', zIndex: 1,
          filter: 'drop-shadow(0 0 40px rgba(0,229,255,0.8)) drop-shadow(0 0 80px rgba(124,110,255,0.5))',
          animation: 'float 5s ease-in-out infinite',
        }}
      />

      {/* Reflection */}
      <div style={{
        position: 'absolute', bottom: '-30px', left: '50%', transform: 'translateX(-50%)',
        width: '60px', height: '20px', borderRadius: '50%',
        background: 'radial-gradient(ellipse,rgba(0,229,255,0.3),transparent 70%)',
        filter: 'blur(8px)',
        animation: 'pulseGlow 5s ease-in-out infinite',
      }} />
    </div>
  );
}

/* ── Binary Rain ── */
function BinaryRain() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${4 + i * 8.5}%`,
          top: 0,
          fontFamily: "'Space Mono', monospace",
          fontSize: '10px',
          color: 'rgba(0,229,255,0.8)',
          lineHeight: 1.8,
          userSelect: 'none',
          animation: `dataStream ${5 + (i % 4)}s linear infinite`,
          animationDelay: `${-i * 1.2}s`,
          opacity: 0.06,
        }}>
          {Array.from({ length: 30 }, () => Math.random() > 0.5 ? '1' : '0').join('\n')}
        </div>
      ))}
    </div>
  );
}

/* ── Hex Grid BG ── */
function HexBG() {
  const hexes = [
    { s: 100, t: '10%', l: '5%',   c: '#00e5ff', d: '0s',  dur: '10s' },
    { s: 65,  t: '70%', l: '3%',   c: '#7c6eff', d: '-4s', dur: '13s' },
    { s: 85,  t: '20%', r: '4%',   c: '#bf5fff', d: '-7s', dur: '9s'  },
    { s: 50,  t: '75%', r: '6%',   c: '#00e5ff', d: '-2s', dur: '11s' },
    { s: 75,  t: '85%', l: '22%',  c: '#7c6eff', d: '-9s', dur: '14s' },
    { s: 45,  t: '8%',  r: '24%',  c: '#ff2d78', d: '-5s', dur: '8s'  },
    { s: 55,  t: '50%', l: '1%',   c: '#00e5ff', d: '-6s', dur: '12s' },
    { s: 40,  t: '45%', r: '2%',   c: '#bf5fff', d: '-3s', dur: '10s' },
  ];
  return (
    <>
      {hexes.map((h, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: h.t, left: h.l, right: h.r,
          width: h.s, height: h.s * 0.866,
          background: h.c,
          clipPath: 'polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)',
          opacity: 0.05,
          filter: `drop-shadow(0 0 ${h.s * 0.12}px ${h.c})`,
          animation: `float ${h.dur} ease-in-out infinite`,
          animationDelay: h.d,
          pointerEvents: 'none',
        }} />
      ))}
    </>
  );
}

/* ── Scan Line ── */
function ScanLine() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 1, pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', left: 0, right: 0, height: '1.5px',
        background: 'linear-gradient(90deg,transparent,rgba(0,229,255,0.5),rgba(124,110,255,0.5),transparent)',
        animation: 'scanline 7s linear infinite',
        boxShadow: '0 0 8px rgba(0,229,255,0.4)',
      }} />
      {/* CRT scanlines overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,229,255,0.008) 2px,rgba(0,229,255,0.008) 4px)',
      }} />
    </div>
  );
}

/* ── Animated Stats Bar ── */
function StatsBar({ visible }) {
  const stats = [
    { val: '12', label: 'Core Members', icon: '👥' },
    { val: '7',  label: 'Activities',   icon: '⚡' },
    { val: '1',  label: 'KSS Done',     icon: '🧠' },
    { val: '∞',  label: 'Ideas',        icon: '💡' },
  ];

  return (
    <div style={{
      display: 'flex', marginTop: '52px',
      background: 'rgba(0,229,255,0.03)',
      border: '1px solid rgba(0,229,255,0.1)',
      borderRadius: '18px', overflow: 'hidden',
      backdropFilter: 'blur(16px)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(30px)',
      transition: 'all 1s cubic-bezier(0.22,1,0.36,1)',
      transitionDelay: '0.5s',
      maxWidth: '560px', margin: '52px auto 0',
      boxShadow: '0 0 0 1px rgba(0,229,255,0.06)',
    }}>
      {stats.map((s, i) => (
        <div
          key={i}
          style={{
            flex: 1, padding: '18px 10px', textAlign: 'center',
            borderRight: i < stats.length - 1 ? '1px solid rgba(0,229,255,0.08)' : 'none',
            transition: 'background 0.25s',
            cursor: 'default',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.07)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{s.icon}</div>
          <div style={{
            fontFamily: 'Orbitron,monospace',
            fontSize: 'clamp(1.3rem,3vw,2rem)',
            fontWeight: 900,
            background: 'linear-gradient(135deg,#00e5ff,#7c6eff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: 'none',
            animation: visible ? `countUp 0.6s ${0.5 + i * 0.1}s both` : 'none',
          }}>{s.val}</div>
          <div style={{
            fontSize: '0.65rem', color: 'rgba(136,153,187,0.8)',
            textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px',
            fontFamily: 'Space Mono, monospace',
          }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ══════ MAIN EXPORT ══════ */
export default function HeroSection({ onTabChange }) {
  const [mounted, setMounted] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setMounted(true), 80);
    const t2 = setTimeout(() => setStatsVisible(true), 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <section className="hero-section" id="section-home">
      {/* Background layers */}
      <div className="hero-bg" style={{ backgroundImage: `url(${heroBg})` }} />
      <div className="hero-overlay" />

      {/* Atmospheric effects */}
      <BinaryRain />
      <HexBG />
      <ScanLine />

      {/* Main content */}
      <div className="hero-content" style={{ position: 'relative', zIndex: 2 }}>

        {/* 3D Logo */}
        <Logo3D mounted={mounted} />

        {/* Glitch Title */}
        <h1 className="hero-title">
          <GlitchTitle text={TITLE} />
        </h1>

        {/* Tagline */}
        <p className="hero-tagline" style={{
          animationName: 'letterDrop',
          animationDuration: '0.8s',
          animationDelay: '0.6s',
          animationFillMode: 'both',
          animationTimingFunction: 'cubic-bezier(0.22,1,0.36,1)',
          opacity: 0,
        }}>
          GL Bajaj&apos;s Student-Driven Tech Ecosystem
          <span style={{ animation: 'blink 1s step-end infinite', color: 'var(--cyan)', marginLeft: '2px' }}>_</span>
        </p>

        {/* CTA Buttons */}
        <div className="hero-buttons" style={{
          animationName: 'letterDrop',
          animationDuration: '0.8s',
          animationDelay: '0.9s',
          animationFillMode: 'both',
          animationTimingFunction: 'cubic-bezier(0.22,1,0.36,1)',
          opacity: 0,
        }}>
          <RippleButton className="btn-primary" href={WHATSAPP_URL}>
            💬 Join Community
          </RippleButton>
          <RippleButton className="btn-outline" onClick={() => onTabChange('Team')}>
            👥 Core Team
          </RippleButton>
        </div>

        {/* Stats */}
        <StatsBar visible={statsVisible} />
      </div>

      {/* Bottom gradient fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '180px',
        background: 'linear-gradient(to bottom,transparent,var(--bg-primary))',
        pointerEvents: 'none', zIndex: 2,
      }} />

      {/* Scroll indicator */}
      <div style={{
        position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
        opacity: 0.5, animation: 'float 2s ease-in-out infinite',
      }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.2em', fontFamily: 'Space Mono,monospace' }}>SCROLL</div>
        <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom,var(--cyan),transparent)' }} />
      </div>
    </section>
  );
}
