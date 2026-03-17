import { useEffect, useRef, useState } from 'react';
import nexasphereLogo from '../assets/images/logos/nexasphere-logo.png';
import heroBg from '../assets/hero-bg.jpg';

const WHATSAPP_URL = 'https://chat.whatsapp.com/Jjc5cuUKENu0RC1vWSEs20';
const TITLE = 'NexaSphere';

// ── Ripple Button ──
function RippleButton({ className, children, onClick, href }) {
  const btnRef = useRef(null);
  const handleClick = (e) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.left = e.clientX - rect.left + 'px';
    ripple.style.top  = e.clientY - rect.top  + 'px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
    onClick && onClick(e);
  };
  if (href) return (
    <a ref={btnRef} href={href} target="_blank" rel="noopener noreferrer"
      className={`btn btn-ripple ${className}`} onClick={handleClick}>{children}</a>
  );
  return (
    <button ref={btnRef} className={`btn btn-ripple ${className}`} onClick={handleClick}>{children}</button>
  );
}

// ── Animated Letter Title ──
function SplitTitle({ text }) {
  return (
    <span style={{ display:'inline-block', perspective:'600px' }}>
      {text.split('').map((ch, i) => (
        <span key={i} style={{
          display: 'inline-block',
          animation: `letterDrop 0.6s cubic-bezier(0.22,1,0.36,1) both`,
          animationDelay: `${0.05 * i}s`,
        }}>
          {ch}
        </span>
      ))}
    </span>
  );
}

// ── Orbiting particles around logo ──
function OrbitRing({ radius, duration, size, color, delay }) {
  return (
    <div style={{
      position:'absolute', top:'50%', left:'50%',
      width: radius*2, height: radius*2,
      marginTop: -radius, marginLeft: -radius,
      borderRadius:'50%',
      border:`1px dashed rgba(${color},0.2)`,
    }}>
      <div style={{
        position:'absolute', top:'50%', left: 0,
        width: size, height: size, borderRadius:'50%',
        background:`rgba(${color},0.9)`,
        boxShadow:`0 0 ${size*3}px rgba(${color},0.8)`,
        marginTop: -size/2, marginLeft: -size/2,
        animation:`orbit ${duration}s linear infinite`,
        animationDelay: delay,
      }} />
    </div>
  );
}

// ── Floating hex grid ──
function HexGrid() {
  const hexes = [
    {size:90, top:'12%', left:'6%',   color:'#00d4ff', delay:'0s',   dur:'9s'},
    {size:55, top:'65%', left:'4%',   color:'#6366f1', delay:'-3s',  dur:'11s'},
    {size:70, top:'20%', right:'5%',  color:'#a855f7', delay:'-6s',  dur:'8s'},
    {size:45, top:'72%', right:'7%',  color:'#00d4ff', delay:'-2s',  dur:'13s'},
    {size:65, top:'82%', left:'18%',  color:'#6366f1', delay:'-8s',  dur:'10s'},
    {size:38, top:'8%',  right:'22%', color:'#a855f7', delay:'-4s',  dur:'7s'},
    {size:50, top:'45%', left:'2%',   color:'#00d4ff', delay:'-5s',  dur:'12s'},
    {size:42, top:'50%', right:'3%',  color:'#6366f1', delay:'-7s',  dur:'9s'},
  ];
  return (
    <>
      {hexes.map((h, i) => (
        <div key={i} style={{
          position:'absolute', top:h.top, left:h.left, right:h.right,
          width:h.size, height:h.size*0.866, pointerEvents:'none',
          background:h.color,
          clipPath:'polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)',
          opacity:0.06,
          animation:`float ${h.dur} ease-in-out infinite`,
          animationDelay:h.delay,
          filter:`drop-shadow(0 0 ${h.size*0.15}px ${h.color})`,
        }} />
      ))}
    </>
  );
}

// ── Scan line effect ──
function ScanLines() {
  return (
    <div style={{
      position:'absolute', inset:0, pointerEvents:'none', zIndex:1, overflow:'hidden',
    }}>
      <div style={{
        position:'absolute', left:0, right:0, height:'2px',
        background:'linear-gradient(90deg,transparent,rgba(0,212,255,0.4),transparent)',
        animation:'scanline 6s linear infinite',
      }} />
      {/* Subtle horizontal lines */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,212,255,0.01) 3px,rgba(0,212,255,0.01) 4px)',
      }} />
    </div>
  );
}

// ── Data stream columns ──
function DataStreams() {
  const streams = Array.from({length:8},(_,i)=>({
    left:`${8+i*12}%`,
    delay:`${-i*2.5}s`,
    duration:`${5+i*0.8}s`,
    chars:'01'.split(''),
  }));
  return (
    <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:0,overflow:'hidden',opacity:0.04}}>
      {streams.map((s,i)=>(
        <div key={i} style={{
          position:'absolute', left:s.left, top:0,
          fontFamily:'monospace', fontSize:'11px',
          color:'var(--cyan)', lineHeight:1.8,
          animation:`dataStream ${s.duration} linear infinite`,
          animationDelay:s.delay,
          userSelect:'none',
        }}>
          {Array.from({length:20},()=>Math.random()>0.5?'1':'0').join('\n')}
        </div>
      ))}
    </div>
  );
}

// ── Stats bar ──
function HeroStats() {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(()=>{
    const t = setTimeout(()=>setVisible(true), 1200);
    return ()=>clearTimeout(t);
  },[]);
  const stats = [
    {val:'12', label:'Core Members'},
    {val:'7',  label:'Activities'},
    {val:'1',  label:'KSS Done'},
    {val:'∞',  label:'Ideas'},
  ];
  return (
    <div ref={ref} style={{
      display:'flex', gap:'0', marginTop:'48px',
      background:'rgba(0,212,255,0.04)',
      border:'1px solid rgba(0,212,255,0.12)',
      borderRadius:'16px', overflow:'hidden',
      opacity: visible?1:0,
      transform: visible?'translateY(0)':'translateY(20px)',
      transition:'all 0.8s cubic-bezier(0.22,1,0.36,1)',
      transitionDelay:'0.3s',
      backdropFilter:'blur(8px)',
    }}>
      {stats.map((s,i)=>(
        <div key={i} style={{
          flex:1, padding:'16px 12px', textAlign:'center',
          borderRight: i<stats.length-1 ? '1px solid rgba(0,212,255,0.1)' : 'none',
          transition:'background 0.3s',
        }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(0,212,255,0.08)'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}
        >
          <div style={{
            fontFamily:'Orbitron,monospace', fontSize:'clamp(1.2rem,3vw,1.8rem)',
            fontWeight:900, color:'var(--cyan)',
            textShadow:'0 0 20px rgba(0,212,255,0.5)',
            animation: visible?'countUp 0.6s ease both':'none',
            animationDelay:`${0.4+i*0.1}s`,
          }}>{s.val}</div>
          <div style={{fontSize:'0.7rem',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginTop:'3px'}}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HeroSection({ onTabChange }) {
  const [logoMounted, setLogoMounted] = useState(false);

  useEffect(()=>{
    const t = setTimeout(()=>setLogoMounted(true), 100);
    return ()=>clearTimeout(t);
  },[]);

  return (
    <section className="hero-section" id="section-home" style={{overflow:'hidden'}}>
      {/* Background */}
      <div className="hero-bg" style={{backgroundImage:`url(${heroBg})`}} />
      <div className="hero-overlay" />

      {/* Data streams */}
      <DataStreams />

      {/* Geo shapes */}
      <HexGrid />

      {/* Scan lines */}
      <ScanLines />

      {/* Content */}
      <div className="hero-content" style={{position:'relative',zIndex:2}}>

        {/* Logo with orbit rings */}
        <div style={{
          position:'relative', display:'inline-block', marginBottom:'32px',
          opacity: logoMounted?1:0,
          transform: logoMounted?'scale(1) rotateY(0deg)':'scale(0.5) rotateY(180deg)',
          transition:'all 1s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <OrbitRing radius={90}  duration={8}  size={6} color='0,212,255'  delay='0s'/>
          <OrbitRing radius={120} duration={12} size={4} color='99,102,241' delay='-4s'/>
          <OrbitRing radius={60}  duration={6}  size={5} color='168,85,247' delay='-2s'/>
          <img src={nexasphereLogo} alt="NexaSphere" className="hero-logo" style={{
            filter:'drop-shadow(0 0 32px rgba(0,212,255,0.7)) drop-shadow(0 0 60px rgba(99,102,241,0.4))',
            animation:'float 4s ease-in-out infinite',
            position:'relative', zIndex:1,
          }} />
        </div>

        {/* Glitching title */}
        <h1 className="hero-title" style={{
          fontFamily:'Orbitron,monospace',
          fontSize:'clamp(2.5rem,8vw,5.5rem)',
          fontWeight:900,
          letterSpacing:'0.12em',
          marginBottom:'8px',
          lineHeight:1,
        }}>
          <span className="animated-gradient-text" style={{
            filter:'drop-shadow(0 0 30px rgba(0,212,255,0.4))',
          }}>
            <SplitTitle text={TITLE} />
          </span>
        </h1>

        {/* Tagline with typing cursor */}
        <p className="hero-tagline" style={{
          animation:'letterDrop 0.8s cubic-bezier(0.22,1,0.36,1) both',
          animationDelay:'0.5s',
          opacity:0,
        }}>
          GL Bajaj&apos;s Student-Driven Tech Ecosystem
          <span style={{animation:'blink 1s step-end infinite',color:'var(--cyan)'}}>_</span>
        </p>

        {/* Buttons */}
        <div className="hero-buttons" style={{
          animation:'letterDrop 0.8s cubic-bezier(0.22,1,0.36,1) both',
          animationDelay:'0.8s',
          opacity:0,
        }}>
          <RippleButton className="btn-primary" href={WHATSAPP_URL}>
            💬 Join Community
          </RippleButton>
          <RippleButton className="btn-outline" onClick={()=>onTabChange('Team')}>
            👥 Core Team
          </RippleButton>
        </div>

        {/* Stats bar */}
        <HeroStats />
      </div>

      {/* Bottom fade */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, height:'120px',
        background:'linear-gradient(to bottom, transparent, var(--bg-primary))',
        pointerEvents:'none', zIndex:2,
      }} />
    </section>
  );
}
