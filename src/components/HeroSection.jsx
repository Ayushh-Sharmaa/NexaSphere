import { useEffect, useRef, useState, useCallback } from 'react';
import nexasphereLogo from '../assets/images/logos/nexasphere-logo.png';
import heroBg from '../assets/hero-bg.jpg';

const WHATSAPP = 'https://chat.whatsapp.com/Jjc5cuUKENu0RC1vWSEs20';

/* ── Ripple Button ── */
function RippleBtn({ cls, children, onClick, href }) {
  const ref = useRef(null);
  const go = e => {
    const b = ref.current; if (!b) return;
    const rect = b.getBoundingClientRect();
    const el = document.createElement('span');
    el.className = 'rpl';
    el.style.left = (e.clientX - rect.left) + 'px';
    el.style.top  = (e.clientY - rect.top)  + 'px';
    b.appendChild(el);
    setTimeout(() => el.remove(), 750);
    onClick && onClick(e);
  };
  if (href) return <a ref={ref} href={href} target="_blank" rel="noopener noreferrer" className={`btn btn-ripple ${cls}`} onClick={go}>{children}</a>;
  return <button ref={ref} className={`btn btn-ripple ${cls}`} onClick={go}>{children}</button>;
}

/* ── Chromatic glitch title ── */
function GlitchTitle({ text, theme }) {
  const [g, setG] = useState(false);
  useEffect(() => {
    const id = setInterval(() => {
      setG(true);
      setTimeout(() => setG(false), 220);
    }, 5200 + Math.random() * 2800);
    return () => clearInterval(id);
  }, []);

  const grad = theme === 'light'
    ? 'linear-gradient(270deg,#d97706,#7c3aed,#be185d,#0891b2,#d97706)'
    : 'linear-gradient(270deg,#00e5ff,#7c6eff,#bf5fff,#ff2d78,#00e5ff)';

  const letters = text.split('').map((ch, i) => (
    <span key={i} style={{
      display:'inline-block',
      background:grad,backgroundSize:'300% 300%',
      WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',
      animationName:'letterDrop, gradientShift',
      animationDuration:'0.55s, 4s',
      animationTimingFunction:'cubic-bezier(.22,1,.36,1), ease',
      animationFillMode:'both, none',
      animationDelay:`${.04*i}s, ${i*.08}s`,
      animationIterationCount:'1, infinite',
    }}>{ch}</span>
  ));

  return (
    <span style={{position:'relative',display:'inline-block'}}>
      <style>{`
        @keyframes g1{0%,100%{clip-path:inset(5% 0 90% 0);transform:translateX(-4px)}25%{clip-path:inset(35% 0 55% 0);transform:translateX(4px)}50%{clip-path:inset(65% 0 25% 0);transform:translateX(-2px)}75%{clip-path:inset(80% 0 10% 0);transform:translateX(3px)}}
        @keyframes g2{0%,100%{clip-path:inset(70% 0 5% 0);transform:translateX(4px)}33%{clip-path:inset(15% 0 75% 0);transform:translateX(-4px)}66%{clip-path:inset(45% 0 45% 0);transform:translateX(2px)}}
      `}</style>
      {letters}
      {g && <>
        <span aria-hidden="true" style={{position:'absolute',top:0,left:0,width:'100%',background:grad,backgroundSize:'300% 300%',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',animation:'g1 .22s steps(2) infinite',filter:'hue-rotate(180deg)',opacity:.85}}>{text}</span>
        <span aria-hidden="true" style={{position:'absolute',top:0,left:0,width:'100%',background:grad,backgroundSize:'300% 300%',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',animation:'g2 .22s steps(2) infinite',filter:'hue-rotate(-90deg)',opacity:.75}}>{text}</span>
      </>}
    </span>
  );
}

/* ── Orbit rings via SVG animateMotion ── */
function OrbitRings({ theme }) {
  const rings = theme === 'light'
    ? [
        { rx:105,ry:48,  dur:8,  r:2,  col:'217,119,6',  delay:'0s' },
        { rx:58, ry:185, dur:13, r:1.5,col:'124,58,237',  delay:'-5s' },
        { rx:165,ry:38,  dur:17, r:1,  col:'190,24,93',   delay:'-9s' },
        { rx:80, ry:160, dur:6,  r:2,  col:'8,145,178',   delay:'-2s' },
      ]
    : [
        { rx:105,ry:48,  dur:8,  r:2,  col:'0,229,255',   delay:'0s' },
        { rx:58, ry:185, dur:13, r:1.5,col:'124,110,255', delay:'-5s' },
        { rx:165,ry:38,  dur:17, r:1,  col:'191,95,255',  delay:'-9s' },
        { rx:80, ry:160, dur:6,  r:2,  col:'0,255,157',   delay:'-2s' },
      ];
  const tilts = ['rotate(-22 250 250)','rotate(14 250 250)','rotate(55 250 250)','rotate(-35 250 250)'];

  return (
    <svg width="280" height="280" viewBox="0 0 500 500"
      style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',pointerEvents:'none',zIndex:0}}>
      {rings.map((rg, i) => (
        <g key={i} transform={tilts[i]}>
          <ellipse cx="250" cy="250" rx={rg.rx} ry={rg.ry} fill="none" stroke={`rgba(${rg.col},.2)`} strokeWidth="1"/>
          <circle r={rg.r*3.5} fill={`rgba(${rg.col},.95)`}
            style={{filter:`drop-shadow(0 0 ${rg.r*6}px rgba(${rg.col},.9))`}}>
            <animateMotion dur={`${rg.dur}s`} repeatCount="indefinite" begin={rg.delay}>
              <mpath href={`#orb${i}`}/>
            </animateMotion>
          </circle>
          <path id={`orb${i}`} d={`M ${250-rg.rx} 250 a ${rg.rx} ${rg.ry} 0 1 1 ${rg.rx*2} 0 a ${rg.rx} ${rg.ry} 0 1 1 -${rg.rx*2} 0`} fill="none"/>
        </g>
      ))}
    </svg>
  );
}

/* ── 3D Tilt Logo ── */
function Logo3D({ mounted, theme }) {
  const ref = useRef(null);
  const onMove = useCallback(e => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width/2, cy = rect.top + rect.height/2;
    const dx = (e.clientX - cx)/220, dy = (e.clientY - cy)/220;
    el.style.transform = `perspective(700px) rotateX(${-dy*16}deg) rotateY(${dx*16}deg) scale(1.04)`;
  }, []);
  const onLeave = useCallback(() => { if (ref.current) ref.current.style.transform = ''; }, []);

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{
        position:'relative', display:'inline-block', marginBottom:'28px',
        transformStyle:'preserve-3d', transition:'transform .14s ease',
        opacity:mounted?1:0, transform:mounted?'scale(1)':'scale(.3) rotateY(180deg)',
        transitionProperty:'opacity,transform', transitionDuration:'1.1s',
        transitionTimingFunction:'cubic-bezier(.34,1.56,.64,1)',
        width:'160px', height:'160px',
      }}>
      <OrbitRings theme={theme}/>
      {/* Logo image — mix-blend-mode screen removes black background */}
      <img
        src={nexasphereLogo}
        alt="NexaSphere"
        style={{
          position:'relative', zIndex:1,
          width:'120px', height:'120px',
          objectFit:'contain',
          margin:'20px auto 0',
          display:'block',
          mixBlendMode: theme === 'light' ? 'multiply' : 'screen',
          animation:'float 5s ease-in-out infinite',
          filter: theme === 'light'
            ? 'drop-shadow(0 4px 16px rgba(0,0,0,.2))'
            : 'drop-shadow(0 0 28px rgba(0,229,255,.6)) drop-shadow(0 0 56px rgba(124,110,255,.35))',
        }}
      />
      {/* Ground shadow */}
      <div style={{position:'absolute',bottom:'-10px',left:'50%',transform:'translateX(-50%)',width:'60px',height:'12px',borderRadius:'50%',background:`radial-gradient(ellipse,${theme==='light'?'rgba(0,0,0,.12)':'rgba(0,229,255,.2)'},transparent 70%)`,filter:'blur(5px)',animation:'float 5s ease-in-out infinite'}}/>
    </div>
  );
}

/* ── Binary rain ── */
function BinRain({ theme }) {
  if (theme === 'light') return null;
  return (
    <div style={{position:'absolute',inset:0,overflow:'hidden',zIndex:0,pointerEvents:'none'}}>
      {Array.from({length:10},(_,i)=>(
        <div key={i} style={{
          position:'absolute',left:`${5+i*10}%`,top:0,
          fontFamily:"'Space Mono',monospace",fontSize:'9px',
          color:'var(--c1)',lineHeight:1.9,userSelect:'none',
          animation:`dataStream ${4.5+i*.7}s linear infinite`,
          animationDelay:`${-i*1.4}s`,opacity:.07,
        }}>
          {Array.from({length:28},()=>Math.random()>.5?'1':'0').join('\n')}
        </div>
      ))}
    </div>
  );
}

/* ── Floating hex shapes ── */
function HexBG({ theme }) {
  const hexes = [
    {s:88,t:'11%',l:'5%',d:'0s',dur:'10s'},{s:56,t:'68%',l:'3%',d:'-4s',dur:'13s'},
    {s:74,t:'18%',r:'4%',d:'-7s',dur:'9s'},{s:44,t:'74%',r:'6%',d:'-2s',dur:'12s'},
    {s:66,t:'84%',l:'20%',d:'-9s',dur:'14s'},{s:40,t:'7%',r:'22%',d:'-5s',dur:'8s'},
  ];
  const col = theme === 'light' ? ['#d97706','#7c3aed','#be185d'] : ['#00e5ff','#7c6eff','#bf5fff'];
  return <>
    {hexes.map((h,i)=>(
      <div key={i} style={{
        position:'absolute',top:h.t,left:h.l,right:h.r,
        width:h.s,height:h.s*.866,
        background:col[i%3],
        clipPath:'polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)',
        opacity: theme === 'light' ? .04 : .05,
        filter:`drop-shadow(0 0 ${h.s*.1}px ${col[i%3]})`,
        animation:`float ${h.dur} ease-in-out infinite`,animationDelay:h.d,
        pointerEvents:'none',
      }}/>
    ))}
  </>;
}

/* ── Scanline ── */
function Scan({ theme }) {
  if (theme === 'light') return null;
  return (
    <div style={{position:'absolute',inset:0,overflow:'hidden',zIndex:1,pointerEvents:'none'}}>
      <div style={{position:'absolute',left:0,right:0,height:'1.5px',background:'linear-gradient(90deg,transparent,rgba(0,229,255,.4),rgba(124,110,255,.4),transparent)',animation:'scanline 8s linear infinite',boxShadow:'0 0 8px rgba(0,229,255,.3)'}}/>
      <div style={{position:'absolute',inset:0,backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,229,255,.006) 2px,rgba(0,229,255,.006) 4px)'}}/>
    </div>
  );
}

/* ── Stats bar ── */
function Stats({ vis, theme }) {
  const items = [
    {v:'12',l:'Members',i:'👥'},{v:'7',l:'Activities',i:'⚡'},
    {v:'1', l:'KSS Done', i:'🧠'},{v:'∞',l:'Ideas',    i:'💡'},
  ];
  const isLight = theme === 'light';
  return (
    <div style={{
      display:'flex',marginTop:'48px',maxWidth:'520px',margin:'48px auto 0',
      background: isLight ? 'rgba(28,25,23,0.04)' : 'rgba(0,229,255,.03)',
      border: isLight ? '1px solid rgba(28,25,23,0.09)' : '1px solid rgba(0,229,255,.09)',
      borderRadius:'16px',overflow:'hidden',
      backdropFilter: isLight ? 'none' : 'blur(16px)',
      opacity:vis?1:0,transform:vis?'none':'translateY(28px)',
      transition:'all .9s cubic-bezier(.22,1,.36,1)',transitionDelay:'.45s',
    }}>
      {items.map((s,i)=>(
        <div key={i} style={{
          flex:1,padding:'16px 8px',textAlign:'center',cursor:'default',
          borderRight: i<3 ? `1px solid ${isLight?'rgba(28,25,23,.07)':'rgba(0,229,255,.08)'}` : 'none',
          transition:'background .22s',
        }}
          onMouseEnter={e=>e.currentTarget.style.background=isLight?'rgba(28,25,23,.06)':'rgba(0,229,255,.07)'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}
        >
          <div style={{fontSize:'1rem',marginBottom:'3px'}}>{s.i}</div>
          <div style={{
            fontFamily:'Orbitron,monospace',fontSize:'clamp(1.2rem,3vw,1.9rem)',fontWeight:900,
            background: isLight ? 'linear-gradient(135deg,#d97706,#7c3aed)' : 'linear-gradient(135deg,#00e5ff,#7c6eff)',
            WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',
            animation:vis?`countUp .55s ${.45+i*.1}s both`:'none',
          }}>{s.v}</div>
          <div style={{fontSize:'.62rem',color:'var(--t2)',textTransform:'uppercase',letterSpacing:'.1em',marginTop:'1px',fontFamily:"'Space Mono',monospace"}}>{s.l}</div>
        </div>
      ))}
    </div>
  );
}

/* ══════ MAIN EXPORT ══════ */
export default function HeroSection({ onTabChange, theme = 'dark' }) {
  const [mounted, setMounted] = useState(false);
  const [statsVis, setStatsVis] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setMounted(true), 80);
    const t2 = setTimeout(() => setStatsVis(true), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <section className="hero-section" id="section-home">
      <div className="hero-bg" style={{backgroundImage:`url(${heroBg})`}}/>
      <div className="hero-overlay"/>
      <BinRain theme={theme}/>
      <HexBG theme={theme}/>
      <Scan theme={theme}/>

      <div className="hero-content" style={{position:'relative',zIndex:2}}>
        <Logo3D mounted={mounted} theme={theme}/>

        <h1 className="hero-title">
          <GlitchTitle text="NexaSphere" theme={theme}/>
        </h1>

        <p className="hero-tagline" style={{
          animationName:'letterDrop',animationDuration:'.8s',animationDelay:'.55s',
          animationFillMode:'both',animationTimingFunction:'cubic-bezier(.22,1,.36,1)',opacity:0,
        }}>
          GL Bajaj&apos;s Student-Driven Tech Ecosystem
          <span style={{animation:'blink 1s step-end infinite',color:'var(--c1)',marginLeft:'2px'}}>_</span>
        </p>

        <div className="hero-buttons" style={{
          animationName:'letterDrop',animationDuration:'.8s',animationDelay:'.85s',
          animationFillMode:'both',animationTimingFunction:'cubic-bezier(.22,1,.36,1)',opacity:0,
        }}>
          <RippleBtn cls="btn-primary" href={WHATSAPP}>💬 Join Community</RippleBtn>
          <RippleBtn cls="btn-outline" onClick={()=>onTabChange('Team')}>👥 Core Team</RippleBtn>
        </div>

        <Stats vis={statsVis} theme={theme}/>
      </div>

      {/* Bottom fade */}
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:'160px',background:'linear-gradient(to bottom,transparent,var(--bg))',pointerEvents:'none',zIndex:2}}/>

      {/* Scroll indicator */}
      <div style={{position:'absolute',bottom:'28px',left:'50%',transform:'translateX(-50%)',zIndex:3,display:'flex',flexDirection:'column',alignItems:'center',gap:'5px',opacity:.45,animation:'float 2.5s ease-in-out infinite'}}>
        <div style={{fontSize:'.6rem',color:'var(--t3)',letterSpacing:'.22em',fontFamily:"'Space Mono',monospace"}}>SCROLL</div>
        <div style={{width:'1px',height:'36px',background:'linear-gradient(to bottom,var(--c1),transparent)'}}/>
      </div>
    </section>
  );
}
