import { useEffect, useRef } from 'react';
import nexasphereLogo from '../assets/images/logos/nexasphere-logo.png';
import heroBg from '../assets/hero-bg.jpg';

const WHATSAPP_URL = 'https://chat.whatsapp.com/Jjc5cuUKENu0RC1vWSEs20';

function RippleButton({ className, children, onClick, href }) {
  const btnRef = useRef(null);

  const handleClick = (e) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.left = e.clientX - rect.left + 'px';
    ripple.style.top = e.clientY - rect.top + 'px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
    onClick && onClick(e);
  };

  if (href) {
    return (
      <a
        ref={btnRef}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`btn btn-ripple ${className}`}
        onClick={handleClick}
      >
        {children}
      </a>
    );
  }
  return (
    <button ref={btnRef} className={`btn btn-ripple ${className}`} onClick={handleClick}>
      {children}
    </button>
  );
}

export default function HeroSection({ onTabChange }) {
  // Floating geo shapes
  const shapes = [
    { type: 'hex', size: 80, top: '15%', left: '8%', color: '#00d4ff', delay: '0s' },
    { type: 'tri', size: 60, top: '60%', left: '5%', color: '#6366f1', delay: '-3s' },
    { type: 'circle', size: 50, top: '25%', right: '6%', color: '#a855f7', delay: '-6s' },
    { type: 'hex', size: 40, top: '70%', right: '8%', color: '#00d4ff', delay: '-2s' },
    { type: 'tri', size: 70, top: '80%', left: '20%', color: '#6366f1', delay: '-8s' },
    { type: 'circle', size: 35, top: '10%', right: '25%', color: '#a855f7', delay: '-4s' },
  ];

  const renderShape = (s, i) => {
    const style = {
      position: 'absolute',
      top: s.top,
      left: s.left,
      right: s.right,
      opacity: 0.07,
      pointerEvents: 'none',
      animationDelay: s.delay,
    };

    if (s.type === 'circle') {
      return (
        <div
          key={i}
          className="geo-shape circle"
          style={{
            ...style,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            border: `2px solid ${s.color}`,
          }}
        />
      );
    }
    if (s.type === 'hex') {
      return (
        <div
          key={i}
          className="geo-shape hex"
          style={{
            ...style,
            width: s.size,
            height: s.size * 0.866,
            background: s.color,
            clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
          }}
        />
      );
    }
    if (s.type === 'tri') {
      return (
        <div
          key={i}
          className="geo-shape tri"
          style={{
            ...style,
            width: 0,
            height: 0,
            borderLeft: `${s.size / 2}px solid transparent`,
            borderRight: `${s.size / 2}px solid transparent`,
            borderBottom: `${s.size}px solid ${s.color}`,
            background: 'none',
          }}
        />
      );
    }
  };

  return (
    <section className="hero-section" id="section-home">
      {/* Background */}
      <div className="hero-bg" style={{ backgroundImage: `url(${heroBg})` }} />
      <div className="hero-overlay" />

      {/* Floating shapes */}
      {shapes.map(renderShape)}

      {/* Content */}
      <div className="hero-content reveal">
        <div className="hero-logo-wrap">
          <img src={nexasphereLogo} alt="NexaSphere" className="hero-logo" />
        </div>

        <h1 className="hero-title animated-gradient-text">NexaSphere</h1>

        <p className="hero-tagline">
          GL Bajaj&apos;s Student-Driven Tech Ecosystem
        </p>

        <div className="hero-buttons">
          <RippleButton className="btn-primary" href={WHATSAPP_URL}>
            💬 Join Community
          </RippleButton>
          <RippleButton
            className="btn-outline"
            onClick={() => onTabChange('Team')}
          >
            👥 Core Team
          </RippleButton>
        </div>
      </div>
    </section>
  );
}
